import {
  IMediaRecorder,
  MediaRecorder,
  register,
  deregister,
} from "extendable-media-recorder";
import { connect as wavEncodedConnect } from "extendable-media-recorder-wav-encoder";

import { WebSocketDataChannel } from "../DataChannel";
import { TLogger, TRealtimeWebSocketConfig, TResponse } from "../shared/@types";
import { fetchWithRetry } from "../utils";

export class RealtimeWebSocketConnection {
  private readonly _config: TRealtimeWebSocketConfig;
  private readonly _logLabel = "RealtimeWebSocketConnection";
  private readonly _logger: TLogger | undefined;
  private _isConnecting: boolean = false;

  socket: WebSocket | null;
  dataChannel: WebSocketDataChannel | null;
  media: {
    stream: MediaStream | null;
    recorder: IMediaRecorder | null;
    audioContext: AudioContext | null;
    queue: Buffer[];
    isPlaying: boolean;
    source?: AudioBufferSourceNode | null;
    wavEncoderPort?: MessagePort | null;
  } = {
    stream: null,
    recorder: null,
    audioContext: null,
    queue: [],
    isPlaying: false,
    source: null,
    wavEncoderPort: null,
  };

  abortController: null | AbortController = null;

  constructor(config: TRealtimeWebSocketConfig) {
    this._config = config;
    this._logger = config.logger;
    this.dataChannel = null;
    this.socket = null;
  }
  private async _setupAudio() {
    try {
      if (!this.media.wavEncoderPort) {
        this.media.wavEncoderPort = await wavEncodedConnect();
        await register(this.media.wavEncoderPort);
      }

      const audioContext = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: this._config.audio || true,
      });
      this.media.stream = stream;

      this.media.recorder = new MediaRecorder(this.media.stream, {
        mimeType: "audio/wav",
      });
      this.media.audioContext = audioContext;

      this._logger?.info(this._logLabel, "Audio setup complete");
      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, "Error setting up audio", error);
      return {
        error,
      };
    }
  }

  private async _getOfferURL(
    functionURL: string
  ): Promise<TResponse<string, string>> {
    try {
      // Try to resolve the function URL.
      await fetchWithRetry(
        functionURL + "/connections",
        { signal: this.abortController?.signal },
        7
      );

      return {
        ok: true,
        data: functionURL.replace("https://", "wss://"),
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      console.error("Error resolving function URL:", error);
      return {
        error: "Failed to resolve offer URL",
      };
    }
  }

  async connect(): Promise<TResponse> {
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

    const setupAudioResponse = await this._setupAudio();

    if (!setupAudioResponse.ok) {
      this._isConnecting = false;

      return setupAudioResponse;
    }

    this.abortController = new AbortController();
    const response = await this._getOfferURL(config.functionURL);

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

    const sendMetadataResponse = this.sendAudioMetadata();

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
      this.media.recorder!.start();
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

  sendAudioMetadata(): TResponse {
    if (!this.media.stream) {
      this._logger?.warn(this._logLabel, "No audio stream available");
      return { error: "No audio stream available" };
    }

    try {
      const audioSettings = this.media.stream.getTracks()[0].getSettings();

      this._logger?.info(this._logLabel, "Audio settings:", audioSettings);
      const metadata = {
        samplingRate:
          audioSettings.sampleRate || this.media.audioContext?.sampleRate,
        audioEncoding: "linear16",
      };

      this.dataChannel!.send({ type: "audio_metadata", payload: metadata });

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

  async playAudio(arrayBuffer: ArrayBuffer): Promise<TResponse> {
    if (!this.media || !this.media.audioContext) {
      this._logger?.error(
        this._logLabel,
        "Not audio context. It looks like connect() was not successful."
      );
      return {
        error: "Not audio context. It looks like connect() was not successful.",
      };
    }

    try {
      this.media.isPlaying = true;
      this.media.audioContext.resume();
      const buffer = await this.media.audioContext.decodeAudioData(arrayBuffer);
      this.media.source = this.media.audioContext.createBufferSource();
      this.media.source.buffer = buffer;
      this.media.source.connect(this.media.audioContext.destination);
      this.media.source.start(0);
    } catch (error) {
      this.media.isPlaying = false;
      this._logger?.error(this._logLabel, "Error playing audio", error);

      return {
        error,
      };
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.media.source) {
          this.media.source.onended = () => {
            this.media.isPlaying = false;

            if (this.media.source && this.media.audioContext) {
              this.media.source.disconnect(this.media.audioContext.destination);
            }

            resolve({ ok: true });
          };
        }
      } catch (error) {
        this.media.isPlaying = false;
        this._logger?.error(this._logLabel, "Error playing audio", error);
        reject({ error });
      }
    });
  }

  async disconnect(): Promise<TResponse> {
    try {
      this.abortController?.abort();
      this.media.queue = [];
      this.media.recorder?.stop();
      this.dataChannel?.send({ type: "websocket_stop" });
      this.socket?.close();

      if (this.media.wavEncoderPort) {
        await deregister(this.media.wavEncoderPort);
        this.media.wavEncoderPort = null;
      }

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
}
