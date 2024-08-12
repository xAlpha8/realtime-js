import { TLogger, TMedia, TRealtimeConfig, TResponse } from "../shared/@types";

/**
 * This class handles getting access of all the media devices after reading the config
 */
export class RealtimeConnectionMediaManager {
  private readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private _peerConnection: RTCPeerConnection;
  private _isSetupCompleted = false;
  private readonly _logLabel = "RealtimeConnectionMediaManager";

  localStreams: Record<"audio" | "video" | "screen", TMedia[]>;
  remoteStreams: Record<"audio" | "video", TMedia[]>;

  constructor(peerConnection: RTCPeerConnection, config: TRealtimeConfig) {
    this._peerConnection = peerConnection;
    this._config = config;
    this._logger = this._config.logger;
    this.localStreams = {
      audio: [],
      video: [],
      screen: [],
    };

    this.remoteStreams = {
      video: [],
      audio: [],
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
      const media = {
        stream: event.streams[0],
        track: event.track,
      };

      if (media.track.kind === "audio") {
        this.remoteStreams.audio.push(media);
      } else if (media.track.kind === "video") {
        this.remoteStreams.video.push(media);
      }
    });

    this._isSetupCompleted = true;

    return {
      ok: true,
    };
  }

  async setupWithMediaDevices(
    constraints: MediaStreamConstraints
  ): Promise<TResponse> {
    const mediaStream = await this.getUserMedia(constraints);

    if (!mediaStream) {
      this._logger?.warn(this._logLabel, "Unable to get media stream");
      this._isSetupCompleted = true;
      return {
        error: "Unable to get media stream",
      };
    }

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

  setupWithoutMediaDevices(): TResponse {
    try {
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

  async getUserMedia(constraints: MediaStreamConstraints) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      this._logger?.error(this._logLabel, e);
      return null;
    }
  }

  warnIfAskedForResourceBeforeSetupIsCompleted(type: string) {
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

    return this.localStreams.video[0] || null;
  }

  getLocalAudioStream() {
    if (!this._isSetupCompleted) {
      this.warnIfAskedForResourceBeforeSetupIsCompleted("audio");
      return null;
    }

    return this.localStreams.audio[0] || null;
  }

  releaseAllLocalStream() {
    try {
      [
        ...this.localStreams.audio,
        ...this.localStreams.video,
        ...this.localStreams.screen,
      ].forEach((media) => {
        media.track.stop();
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
