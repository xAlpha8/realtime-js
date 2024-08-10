import { TLogger, TRealtimeConfig } from "../shared/@types";
import { RealtimeConnectionMediaManager } from "./RealtimeConnectionMediaManager";

export class RealtimeConnection {
  readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private readonly _logLabel = "RealtimeConnection";
  peerConnection: RTCPeerConnection;
  // dataChannel: RTCDataChannel;
  // tracks: RTCTrackEvent;
  mediaManager: RealtimeConnectionMediaManager;

  constructor(config: TRealtimeConfig) {
    this._config = config;
    this._logger = this._config.logger;
    this.peerConnection = new RTCPeerConnection(this._config.rtcConfig);
    this.mediaManager = new RealtimeConnectionMediaManager(
      this.peerConnection,
      this._config
    );
  }

  /**
   * Establishes the WebRTC connection. After establishing connection
   * it will also update tracks.
   *
   * @returns {} - Resolves when the connection is established.
   * @throws Will throw an error if the connection cannot be established.
   */
  async connect(): Promise<boolean> {
    const response = await this.mediaManager.setup();

    if (!response) {
      this._logger?.error(
        this._logLabel,
        "Failed to setup RealtimeConnectionMediaManager"
      );
      return false;
    }

    return true;
  }

  /**
   * Disconnects the WebRTC connection.
   *
   * @returns {Promise<void>} - Resolves when the connection is disconnected.
   * @throws Will throw an error if the connection cannot be disconnected.
   */
  async disconnect(): Promise<void> {}

  /**
   * Returns all the video streams using this.tracks
   * These are the streams we are receiving from the server.
   **/
  // getRemoteVideoStreams(): Promise<MediaStream[]> {}

  /**
   * Returns all the audio streams using this.tracks
   * These are the streams we are receiving from the server.
   **/
  // getRemoteAudioStreams(): Promise<MediaStream[]> {}
}
