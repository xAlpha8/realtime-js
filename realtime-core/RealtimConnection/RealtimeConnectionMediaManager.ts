import { TLogger, TMedia, TRealtimeConfig } from "../shared/@types";

/**
 * This class handles getting access of all the media devices after reading the config
 */
export class RealtimeConnectionMediaManager {
  private readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private _localAudio: TMedia | null = null;
  private _localVideo: TMedia | null = null;
  private _peerConnection: RTCPeerConnection;
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
  async setup(): Promise<boolean> {
    const constraints: MediaStreamConstraints = {};

    const audioConfig = this._config.audio;
    const videoConfig = this._config.video;
    // const screenConfig = this._config.screen;

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

    const mediaStream = await this.getUserMedia(constraints);

    if (!mediaStream) {
      this._logger?.warn(this._logLabel, "Unable to get media stream");
      return false;
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
    });

    if (audioConfig && !this._localAudio) {
      this._logger?.warn(this._logLabel, "Unable to get audio stream.");
    }

    if (videoConfig && !this._localVideo) {
      this._logger?.warn(this._logLabel, "Unable to get video stream.");
    }

    return true;
  }

  async getUserMedia(constraints: MediaStreamConstraints) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      this._logger?.error(this._logLabel, e);
      return null;
    }
  }

  getLocalVideoStream() {
    if (this._localVideo) {
      return this._localVideo.stream;
    }
    return null;
  }

  getLocalAudioStream() {
    if (this._localAudio) {
      return this._localAudio.stream;
    }

    return null;
  }
}
