import { TLogger, TMedia, TRealtimeConfig, TResponse } from "../shared/@types";

/**
 * This class handles getting access of all the media devices after reading the config
 */
export class RealtimeConnectionMediaManager {
  private readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private _localAudio: TMedia | null = null;
  private _localVideo: TMedia | null = null;
  private _remoteStreams: TMedia[] = [];
  private _peerConnection: RTCPeerConnection;
  private _isSetupCompleted = false;
  private readonly _logLabel = "RealtimeConnectionMediaManager";

  constructor(peerConnection: RTCPeerConnection, config: TRealtimeConfig) {
    this._peerConnection = peerConnection;
    this._config = config;
    this._logger = this._config.logger;
  }

  /**
   * Read the config, build the media stream constraints and
   * display media constraints and add save streams.
   */
  async setup(): Promise<TResponse<string>> {
    const constraints: MediaStreamConstraints = {};

    const audioConfig = this._config.audio;
    const videoConfig = this._config.video;
    const screenConfig = this._config.screen;

    if (audioConfig) {
      constraints.audio =
        typeof audioConfig === "boolean"
          ? audioConfig
          : audioConfig.constraints;
    }

    if (videoConfig) {
      constraints.video =
        typeof videoConfig === "boolean"
          ? videoConfig
          : videoConfig.constraints;
    }

    let setupMediaResponse: TResponse = {};

    if (audioConfig || videoConfig) {
      setupMediaResponse = await this.setupWithMediaDevices(constraints);
    } else {
      setupMediaResponse = this.setupWithoutMediaDevices();
    }

    if (!setupMediaResponse.ok) {
      return {
        error: "Failed to setup user media",
      };
    }

    if (screenConfig) {
      setupMediaResponse = await this.setupScreenShare(screenConfig);

      if (!setupMediaResponse.ok) {
        return {
          error: "Failed to setup screen for sharing.",
        };
      }
    }

    this._peerConnection.addEventListener("track", (event: RTCTrackEvent) => {
      this._remoteStreams.push({
        stream: event.streams[0],
        track: event.track,
      });
    });

    this._isSetupCompleted = true;

    return {
      ok: true,
    };
  }

  async setupWithMediaDevices(
    constraints: MediaStreamConstraints
  ): Promise<TResponse> {
    this._localAudio = null;
    this._localVideo = null;

    const mediaStream = await this.getUserMedia(constraints);

    if (!mediaStream) {
      this._logger?.warn(this._logLabel, "Unable to get media stream");
      this._isSetupCompleted = true;
      return {
        error: "Unable to get media stream",
      };
    }

    mediaStream.getTracks().forEach((track) => {
      if (track.kind.includes("audio")) {
        this._localAudio = {
          track,
          stream: mediaStream,
        };
      } else if (track.kind.includes("video")) {
        this._localVideo = {
          track,
          stream: mediaStream,
        };
      }

      this._peerConnection.addTrack(track, mediaStream);
    });

    if (constraints.audio && !this._localAudio) {
      this._logger?.warn(this._logLabel, "Unable to get audio stream.");
    }

    if (constraints.video && !this._localVideo) {
      this._logger?.warn(this._logLabel, "Unable to get video stream.");
    }

    return {
      ok: true,
    };
  }

  setupWithoutMediaDevices(): TResponse {
    try {
      // TODO: Make it configurable.
      this._peerConnection.addTransceiver("audio", { direction: "recvonly" });
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

  async setupScreenShare(
    config: DisplayMediaStreamOptions
  ): Promise<TResponse> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(config);
      stream.getTracks().forEach((track) => {
        this._peerConnection.addTrack(track, stream);
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

  async getUserMedia(constraints: MediaStreamConstraints) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      this._logger?.error(this._logLabel, e);
      return null;
    }
  }

  warnIfAskedForResourceBeforeSetupIsCompleted(type: "audio" | "video") {
    this._logger?.warn(
      this._logLabel,
      `Requesting for ${type} before setup is completed, returning null.`
    );
  }

  getLocalVideoStream() {
    if (!this._isSetupCompleted) {
      this.warnIfAskedForResourceBeforeSetupIsCompleted("video");
      return null;
    }

    if (this._localVideo) {
      return this._localVideo.stream;
    }
    return null;
  }

  getLocalAudioStream() {
    if (!this._isSetupCompleted) {
      this.warnIfAskedForResourceBeforeSetupIsCompleted("audio");
      return null;
    }

    if (this._localAudio) {
      return this._localAudio.stream;
    }

    return null;
  }
}
