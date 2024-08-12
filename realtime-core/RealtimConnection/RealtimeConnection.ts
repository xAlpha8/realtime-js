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
  private _isBlocked: boolean = false;

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
        "chat",
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
    if (this._isBlocked) {
      return {
        ok: false,
      };
    }

    this._isBlocked = true;

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

    this._isBlocked = false;
    return {
      ok: true,
    };
  }

  /**
   * Disconnects the WebRTC connection.
   */
  disconnect(): TResponse {
    try {
      if (this.dataChannel) {
        this.dataChannel.close();
      }

      if (this.peerConnection) {
        this.peerConnection.getTransceivers().forEach((transceiver) => {
          transceiver.stop();
        });

        this.peerConnection.getSenders().forEach((sender) => {
          sender.track?.stop();
        });

        this.peerConnection.close();
      }

      const response = this.mediaManager.releaseAllLocalStream();

      return response;
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

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

  send(message: string): TResponse {
    console.log("Inside send");
    if (!this.dataChannel) {
      return {
        error: "Data channel is not initialized.",
      };
    }

    if (this.dataChannel.readyState !== "open") {
      return {
        error: "Connection not ready. Did you call `connect` method?",
      };
    }

    if (typeof message !== "string") {
      return {
        error: "Message must be a string",
      };
    }

    console.log("Sending message.");

    this.dataChannel.send(message);

    return {
      ok: true,
    };
  }
}
