import { TLogger, TRealtimeConfig, TResponse } from "../shared/@types";
import { RealtimeConnectionMediaManager } from "./RealtimeConnectionMediaManager";
import { RealtimeConnectionNegotiator } from "./RealtimeConnectionNegotiator";
export class RealtimeConnection {
  readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private readonly _logLabel = "RealtimeConnection";
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  mediaManager: RealtimeConnectionMediaManager;
  negotiator: RealtimeConnectionNegotiator;

  constructor(config: TRealtimeConfig) {
    this._config = config;
    this._logger = this._config.logger;
    this.peerConnection = new RTCPeerConnection(this._config.rtcConfig);
    this.mediaManager = new RealtimeConnectionMediaManager(
      this.peerConnection,
      this._config
    );
    this.negotiator = new RealtimeConnectionNegotiator(
      this.peerConnection,
      this._config
    );

    const dataChannelOptions = this._config.dataChannelOptions;

    if (dataChannelOptions) {
      this.dataChannel = this.peerConnection.createDataChannel(
        "data",
        dataChannelOptions
      );
    } else {
      this.dataChannel = null;
    }
  }

  /**
   * Establishes the WebRTC connection. After establishing connection
   * it will also update tracks.
   *
   */
  async connect(): Promise<TResponse> {
    let response = await this.mediaManager.setup();

    if (!response.ok) {
      return {
        error: `Failed to setup RealtimeConnectionMediaManager. Response: ${response.error}.`,
      };
    }

    response = await this.negotiator.negotiateAndUpdatePeerConnection();

    if (!response.ok) {
      return {
        error: `Failed during negotiating connection. Response: ${response.error}.`,
      };
    }

    return {
      ok: true,
    };
  }

  /**
   * Disconnects the WebRTC connection.
   *
   */
  async disconnect(): Promise<void> {}

  addEventListeners(
    type: keyof RTCPeerConnectionEventMap,
    listener: (
      this: RTCPeerConnection,
      ev:
        | RTCTrackEvent
        | Event
        | RTCDataChannelEvent
        | RTCPeerConnectionIceEvent
        | RTCPeerConnectionIceErrorEvent
    ) => void
  ) {
    if (!this.peerConnection) {
      this._logger?.error(
        this._logLabel,
        "Unable to add the new event listener. It looks like peerConnection is null. Probably the connection is disconnected."
      );

      return;
    }

    this.peerConnection.addEventListener(type, listener);
  }

  removeEventListeners(
    type: keyof RTCPeerConnectionEventMap,
    listener: (
      this: RTCPeerConnection,
      ev:
        | RTCTrackEvent
        | Event
        | RTCDataChannelEvent
        | RTCPeerConnectionIceEvent
        | RTCPeerConnectionIceErrorEvent
    ) => void
  ) {
    if (!this.peerConnection) {
      this._logger?.error(
        this._logLabel,
        "Unable to remove event listener. It looks like peerConnection is null. Probably the connection is disconnected."
      );

      return;
    }

    this.peerConnection.addEventListener(type, listener);
  }
}
