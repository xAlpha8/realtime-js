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

  addEventListener(
    type: keyof RTCPeerConnectionEventMap | keyof RTCDataChannelEventMap,
    listener: (
      this: RTCPeerConnection,
      ev:
        | RTCTrackEvent
        | Event
        | RTCDataChannelEvent
        | RTCPeerConnectionIceEvent
        | RTCPeerConnectionIceErrorEvent
        | RTCDataChannelEventMap
    ) => void
  ) {
    switch (type) {
      case "bufferedamountlow":
      case "close":
      case "closing":
      case "error":
      case "message":
      case "open":
        if (!this.dataChannel) {
          this._logger?.error(
            this._logLabel,
            "Data channel is not defined. Probably dataParameters is missing in the config."
          );
          return;
        }
        this.dataChannel.addEventListener(type, listener);
        break;
      default:
        // Event listener for peer connection.
        if (!this.peerConnection) {
          this._logger?.error(
            this._logLabel,
            "Unable to add the new event listener. It looks like peerConnection is null. Probably the connection is disconnected."
          );

          return;
        }
        this.peerConnection.addEventListener(type, listener);
    }
  }

  removeEventListener(
    type: keyof RTCPeerConnectionEventMap | keyof RTCDataChannelEventMap,
    listener: (
      this: RTCPeerConnection,
      ev:
        | RTCTrackEvent
        | Event
        | RTCDataChannelEvent
        | RTCPeerConnectionIceEvent
        | RTCPeerConnectionIceErrorEvent
        | RTCDataChannelEventMap
    ) => void
  ) {
    switch (type) {
      case "bufferedamountlow":
      case "close":
      case "closing":
      case "error":
      case "message":
      case "open":
        if (!this.dataChannel) {
          this._logger?.error(
            this._logLabel,
            "Data channel is not defined. Probably dataParameters is missing in the config."
          );
          return;
        }
        this.dataChannel.removeEventListener(type, listener);
        break;
      default:
        // Event listener for peer connection.
        if (!this.peerConnection) {
          this._logger?.error(
            this._logLabel,
            "Unable to add the new event listener. It looks like peerConnection is null. Probably the connection is disconnected."
          );

          return;
        }
        this.peerConnection.removeEventListener(type, listener);
    }
  }

  sendMessage<T extends Record<string, unknown>>(obj: T): TResponse {
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
    try {
      const message = JSON.stringify(obj);
      this.dataChannel.send(message);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        error,
      };
    }
  }
}
