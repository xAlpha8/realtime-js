import { WebSocketDataChannel } from "../DataChannel";
import { TLogger, TRealtimeWebSocketConfig, TResponse } from "../shared/@types";
import { fetchWithRetry } from "../utils";
import { RealtimeWebSocketMediaManager } from "./RealtimeWebSocketMediaManager";

export type TRealtimeWebSocketConnectOptions = {
  /**
   * This option specifies the number of times we should retry the fetch request.
   *
   * To connect to the backend, we need to fetch the offer URL, using the
   * function URL provided in the config. We make a fetch request to this
   * URL, sometimes this fetch request might fail, in that case we can retry the request.
   *
   * @default 7
   */
  retryOnFail?: number;
};

export class RealtimeWebSocketConnection {
  private readonly _config: TRealtimeWebSocketConfig;
  private readonly _logLabel = "RealtimeWebSocketConnection";
  private readonly _logger: TLogger | undefined;
  private _isConnecting: boolean = false;

  socket: WebSocket | null;
  dataChannel: WebSocketDataChannel | null;
  mediaManager: RealtimeWebSocketMediaManager;

  abortController: null | AbortController = null;

  constructor(config: TRealtimeWebSocketConfig) {
    this._config = config;
    this._logger = config.logger;
    this.dataChannel = null;
    this.socket = null;
    this.mediaManager = new RealtimeWebSocketMediaManager(config);
  }

  private async _getOfferURL(
    functionURL: string,
    retryOnFail = 7
  ): Promise<TResponse<string, string>> {
    try {
      const response = await fetchWithRetry(
        functionURL,
        undefined,
        retryOnFail
      );

      const payload = (await response.json()) as unknown;

      // Waiting for connection to start.
      // Making fetch request to check whether it is started.
      await fetchWithRetry(functionURL + "connections", undefined, retryOnFail);

      if (!payload || typeof payload !== "object") {
        throw new Error(
          `Error in establishing connection, 'payload' is undefined or not an object. Type: ${typeof payload}`
        );
      }

      if (
        !("address" in payload) ||
        typeof payload.address !== "string" ||
        !payload.address
      ) {
        throw new Error(
          `Response doesn't contain offer url. Response: ${JSON.stringify(
            payload
          )}`
        );
      }

      const offerURL = payload.address
        .replace("http", "ws")
        .replace("0.0.0.0", "localhost");

      return {
        ok: true,
        data: offerURL,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      console.error("Error resolving function URL:", error);
      return {
        error: "Failed to resolve offer URL",
      };
    }
  }

  private _sendAudioMetadata(): TResponse {
    const metadataResponse = this.mediaManager.getMetadata();

    if (!metadataResponse.ok || !metadataResponse.data) {
      this._logger?.error(
        this._logLabel,
        metadataResponse.error || "Failed to get audio metadata"
      );
      return {
        error: metadataResponse.error,
      };
    }
    try {
      this.dataChannel!.send({
        type: "audio_metadata",
        payload: metadataResponse.data,
      });

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(
        this._logLabel,
        "Error sending audio metadata",
        error
      );
      return { error: "Error sending audio metadata" };
    }
  }

  async connect(
    options = {} as TRealtimeWebSocketConnectOptions
  ): Promise<TResponse> {
    const config = this._config;

    if (!config.functionURL) {
      this._logger?.warn(this._logLabel, "No function URL provided");

      return {
        error: "No function URL provided",
      };
    }

    if (this._isConnecting) {
      this._logger?.warn(this._logLabel, "Already connecting");

      return {
        error: "Already connecting",
      };
    }

    this._isConnecting = true;

    const setupAudioResponse = await this.mediaManager.setup();

    if (!setupAudioResponse.ok) {
      this._isConnecting = false;

      return setupAudioResponse;
    }

    this.abortController = new AbortController();
    const response = await this._getOfferURL(
      config.functionURL,
      options.retryOnFail
    );

    if (!response.ok || !response.data) {
      this._isConnecting = false;

      this._logger?.error(
        this._logLabel,
        `Failed to connect to ${config.functionURL}`,
        response
      );
      return { error: "Failed to connect" };
    }

    this.socket = new WebSocket(response.data, config.protocols);
    this.dataChannel = new WebSocketDataChannel(this.socket);

    const connectionResponse = await new Promise<TResponse>(
      (resolve, reject) => {
        if (!this.socket) {
          return reject({ error: "Socket is not defined" });
        }

        this.socket.onopen = () => {
          this._logger?.info(this._logLabel, "Connected to socket");
          this._isConnecting = false;
          resolve({ ok: true });
        };

        this.socket.onerror = (err) => {
          this._logger?.error(
            this._logLabel,
            "Error connecting to socket",
            err
          );
          this._isConnecting = false;
          reject({ error: err });
        };
      }
    );

    if (!connectionResponse.ok) {
      this._logger?.error(
        this._logLabel,
        "Failed to connect to socket",
        connectionResponse
      );
      return connectionResponse;
    }

    const sendMetadataResponse = this._sendAudioMetadata();

    if (!sendMetadataResponse.ok) {
      this._logger?.error(
        this._logLabel,
        "Failed to send metadata",
        sendMetadataResponse
      );
      return sendMetadataResponse;
    }

    try {
      // Starting recorder
      this.mediaManager.recorder!.start(1);
    } catch (error) {
      this._logger?.error(this._logLabel, "Error starting recorder", error);
      return {
        error,
      };
    }

    this._logger?.info(
      this._logLabel,
      "Connected to socket and started recording"
    );

    return {
      ok: true,
    };
  }

  async disconnect(): Promise<TResponse> {
    try {
      // Cancelling connection request.
      this.abortController?.abort(
        "RealtimeWebSocketConnection.disconnect() is called."
      );

      // Resetting Sockets
      this.dataChannel?.send({ type: "websocket_stop" });
      this.socket?.close();

      this._isConnecting = false;
      this._logger?.info(this._logLabel, "Disconnected");

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, "Error disconnecting", error);
      return {
        error,
      };
    }
  }

  isReady(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}
