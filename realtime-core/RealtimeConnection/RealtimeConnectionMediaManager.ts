import { TLogger, TMedia, TRealtimeConfig, TResponse } from "../shared/@types";

/**
 * This class manages local and remote media streams, including audio, video
 * and screen. It handles the setup of local media by requesting access from
 * the user and adding the media tracks to the peer connection.
 *
 * @param {RTCPeerConnection} peerConnection - The peer connection instance to which media tracks will be added.
 * @param {TRealtimeConfig} config - Configuration object that includes settings related to audio and video constrains etc.
 *
 * @example
 * const peerConnection = new RTCPeerConnection();
 * const config = {
 *  audio: true,
 *  video: {
 *    height: { ideal: 1080 },
 *    width: { ideal: 1920 },
 *    deviceId: "some-device-id"
 *  }
 *  // Other configs
 * };
 * const mediaManager = new RealtimeConnectionMediaManager(peerConnection, config);
 *
 * // Setup local media and add it to the peer connection.
 * const response = await mediaManager.setup();
 * if (response.ok) {
 *   console.log("Setup successfully.");
 * } else {
 *   console.error("Failed to setup:", response.error);
 * }
 */
export class RealtimeConnectionMediaManager {
  private readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private _peerConnection: RTCPeerConnection;
  private _isSetupCompleted = false;
  private readonly _logLabel = "RealtimeConnectionMediaManager";

  // To store all the local streams.
  localStreams: Record<"audio" | "video" | "screen", TMedia[]>;

  constructor(peerConnection: RTCPeerConnection, config: TRealtimeConfig) {
    this._peerConnection = peerConnection;
    this._config = config;
    this._logger = this._config.logger;
    this.localStreams = {
      audio: [],
      video: [],
      screen: [],
    };
  }

  /**
   * Read the config, build the media stream constraints and
   * display media constraints and add save streams.
   */
  async setup(): Promise<TResponse<string>> {
    if (this._isSetupCompleted) {
      this._logger?.warn(
        this._logLabel,
        "RealtimeMediaManager is already setup."
      );

      return {
        ok: true,
      };
    }

    const constraints: MediaStreamConstraints = {};
    const audioConfig = this._config.audio;
    const videoConfig = this._config.video;
    const screenConfig = this._config.screen;

    if (audioConfig) {
      constraints.audio = audioConfig;
    }

    if (videoConfig) {
      constraints.video = videoConfig;
    }

    let setupMediaResponse: TResponse = {};

    if (audioConfig || videoConfig) {
      // If we want user media access.
      setupMediaResponse = await this.setupWithMediaDevices(constraints);
    }

    if (!setupMediaResponse.ok) {
      return {
        error: "Failed to setup user media",
      };
    }

    if (screenConfig) {
      // If we want user display media access.
      setupMediaResponse = await this.setupScreenShare(screenConfig);

      if (!setupMediaResponse.ok) {
        return {
          error: "Failed to setup screen for sharing.",
        };
      }
    }

    const setupWithoutMediaResponse: TResponse =
      this.setupWithoutMediaDevices();

    if (!setupWithoutMediaResponse.ok) {
      return {
        error: "Failed to setup user media",
      };
    }

    this._isSetupCompleted = true;

    return {
      ok: true,
    };
  }

  /**
   * Sets up local media by requesting access to media devices based on the provided constraints.
   * The obtained media stream is added to the peer connection, and the tracks are stored in localStreams.
   *
   * @param {MediaStreamConstraints} constraints - The media stream constraints for accessing media devices.
   * This can include constraints for audio and video.
   *
   * @returns {Promise<TResponse>} A promise that resolves to an object indicating the success
   * or failure of the setup process.
   *
   */
  async setupWithMediaDevices(
    constraints: MediaStreamConstraints
  ): Promise<TResponse> {
    // Obtain the media stream based on the provided constraints.
    const mediaStream = await this.getUserMedia(constraints);

    if (!mediaStream) {
      this._logger?.warn(this._logLabel, "Unable to get media stream");
      this._isSetupCompleted = true;
      return {
        error: "Unable to get media stream",
      };
    }

    // Add each track from the media stream to the peer connection.
    mediaStream.getTracks().forEach((track) => {
      try {
        const stream = new MediaStream([track]);
        this._peerConnection.addTrack(track, stream);

        if (track.kind === "audio") {
          this.localStreams.audio.push({ track, stream });
        } else if (track.kind === "video") {
          this.localStreams.video.push({ track, stream });
        }
      } catch (error) {
        this._logger?.error(this._logLabel, error);

        return {
          error: "Failed to add media track.",
        };
      }
    });

    return {
      ok: true,
    };
  }

  /**
   * Adds the peer connection to receive audio. This is usually used when we don't want
   * any user media access (probably when we give input as text and receive output as audio).
   *
   * @returns {TResponse} An object indicating the success or failure of the setup process.
   */
  setupWithoutMediaDevices(): TResponse {
    try {
      let audioTrackAdded = this.localStreams.audio.length > 0;
      let videoTrackAdded = this.localStreams.video.length > 0;

      if (!audioTrackAdded || !videoTrackAdded) {
        for (const track of this.localStreams.screen) {
          if (track.track.kind === "audio") {
            audioTrackAdded = true;
          } else if (track.track.kind === "video") {
            videoTrackAdded = true;
          }
        }
      }

      if (!audioTrackAdded) {
        this._peerConnection.addTransceiver("audio", { direction: "recvonly" });
      }

      if (!videoTrackAdded) {
        this._peerConnection.addTransceiver("video", { direction: "recvonly" });
      }

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

  /**
   * Sets up screen sharing by requesting access to the user's display media based on the provided configuration.
   * The obtained media stream is added to the peer connection, and the tracks are stored in local media streams.
   *
   * @param {DisplayMediaStreamOptions} config - The options for accessing the display media.
   * @returns {Promise<TResponse>} A promise that resolves to an object indicating the success or failure of the setup process.
   */
  async setupScreenShare(
    config: DisplayMediaStreamOptions
  ): Promise<TResponse> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(config);
      stream.getTracks().forEach((track) => {
        this._peerConnection.addTrack(track, stream);
        this.localStreams.screen.push({ track, stream });
      });

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

  /**
   * Requests access to user media (audio and/or video) based on the provided constraints.
   *
   * @param {MediaStreamConstraints} constraints - The constraints for accessing the user media.
   * @returns {Promise<MediaStream | null>} A promise that resolves to the obtained media stream or null if access fails.
   */
  async getUserMedia(
    constraints: MediaStreamConstraints
  ): Promise<MediaStream | null> {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      this._logger?.error(this._logLabel, e);
      return null;
    }
  }

  /**
   * Releases all local media streams by stopping their tracks. Resets the setup completion status.
   *
   * @returns {TResponse} An object indicating the success or failure of the release process.
   */
  releaseAllLocalStream(): TResponse {
    try {
      [
        ...this.localStreams.audio,
        ...this.localStreams.video,
        ...this.localStreams.screen,
      ].forEach((media) => {
        media.track.stop();
        media.stream.getTracks().forEach((track) => {
          track.stop();
        });
      });

      this._isSetupCompleted = false;
      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }
}
