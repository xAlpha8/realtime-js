import {
  IMediaRecorder,
  MediaRecorder,
  register,
} from "extendable-media-recorder";
import { toBytes } from "fast-base64";
import { connect as wavEncodedConnect } from "extendable-media-recorder-wav-encoder";

import { ETrackOrigin, Track } from "../shared/Track";
import { TLogger, TRealtimeWebSocketConfig, TResponse } from "../shared/@types";
import { RealtimeWebsocketAudioProcessor } from "./RealtimeWebsocketAudioProcessor.worklet";

/**
 * The worklet code runs within the `AudioWorkletGlobalScope`, a special global execution context
 * that operates on a separate Audio Worklet thread. This thread is shared by the worklet and other
 * audio nodes, allowing efficient audio processing.
 *
 * The Audio Worklet thread is sandboxed, meaning the browser enforces a clear separation of the code
 * running in this context. This separation is achieved by loading the worklet code as a module using
 * the `addModule()` function, ensuring that it runs in the correct context.
 *
 * The `RealtimeWebsocketAudioProcessor` class is defined in a file called
 * `RealtimeWebsocketAudioProcessor.worklet.ts`. However, we can't directly pass this code to the
 * `addModule()` function because it expects a URL pointing to a JavaScript module, which maintains
 * this separation.
 *
 * This function converts the `RealtimeWebsocketAudioProcessor` code into a string, performs necessary
 * string replacements to make it compatible with `addModule()`, and then converts the string into a
 * blob URL. This URL can be passed to the `addModule()` function for use in the Audio Worklet.
 */
function getRealtimeWebsocketAudioProcessorURL() {
  const workletCode = `${RealtimeWebsocketAudioProcessor.toString()}
    registerProcessor("audio-processor", RealtimeWebsocketAudioProcessor);
  `
    .replace(
      "class extends AudioWorkletProcessor",
      "var RealtimeWebsocketAudioProcessor = class extends AudioWorkletProcessor"
    )
    .replace(/__publicField.*/g, "");

  // Create a Blob from the string
  const blob = new Blob([workletCode], { type: "application/javascript" });

  // Create an object URL for the blob
  return URL.createObjectURL(blob);
}

export class RealtimeWebSocketMediaManager {
  private readonly _config: TRealtimeWebSocketConfig;
  private readonly _logLabel = "RealtimeWebSocketMediaManager";
  private readonly _logger: TLogger | undefined;
  stream: MediaStream | null;
  track: Track | null;
  recorder: IMediaRecorder | null;
  audioContext: AudioContext | null;
  isPlaying: boolean;
  source?: AudioBufferSourceNode | null;
  wavEncoderPort?: MessagePort | null;
  remoteAudioDestination?: MediaStreamAudioDestinationNode | null;
  remoteAudioTrack?: Track | null;
  hasRegisteredWAVEncoder: boolean;
  audioStartTime: number;
  audioEndTime: number;
  audioWorkletNode: AudioWorkletNode | null;

  constructor(config: TRealtimeWebSocketConfig) {
    this._config = config;
    this.stream = null;
    this.track = null;
    this.recorder = null;
    this.audioContext = null;
    this.isPlaying = false;
    this._logger = config.logger;
    this.hasRegisteredWAVEncoder = false;
    this.audioStartTime = 0;
    this.audioEndTime = 0;
    this.audioWorkletNode = null;
  }

  async setup() {
    try {
      if (!this.hasRegisteredWAVEncoder) {
        this.wavEncoderPort = await wavEncodedConnect();
        await register(this.wavEncoderPort);
        this.hasRegisteredWAVEncoder = true;
      }

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({
        /**
         * If this._config.audio is not defined, then we will use the default
         * audio device. By setting audio to `true`, the browser
         * will pick the default audio device for the user.
         *
         */
        audio: this._config.audio || true,
      });
      this.stream = stream;
      this.track = new Track(stream.getTracks()[0], ETrackOrigin.Local);
      this.recorder = new MediaRecorder(stream, {
        mimeType: "audio/wav",
      });
      this.audioContext = audioContext;
      this._logger?.info(this._logLabel, "Created Audio context");

      /**
       * Setup the AudioWorklet `audioProcessor`. It decodes the b64 encoded audio, and plays it.
       */
      const workletURL = getRealtimeWebsocketAudioProcessorURL();
      await this.audioContext.audioWorklet.addModule(workletURL);
      this._logger?.info(this._logLabel, "Added audio worklet module");
      this.audioWorkletNode = new AudioWorkletNode(
        audioContext,
        "audio-processor"
      );
      this.audioWorkletNode.onprocessorerror = (ev: Event) => {
        this._logger?.error(
          this._logLabel,
          "AudioWorklet processor error:",
          ev
        );
      };

      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data === "agent_start_talking") {
          console.log("agent_start_talking");
          this.isPlaying = true;
          this.audioStartTime = new Date().getTime() / 1000;
          if (this.remoteAudioDestination) {
            this.audioWorkletNode?.connect(this.remoteAudioDestination);
          } else {
            this.audioWorkletNode?.connect(this.audioContext!.destination);
          }
        } else if (event.data === "agent_stop_talking") {
          console.log("agent_stop_talking");
          this.isPlaying = false;
          this.audioStartTime = 0;
          if (this.remoteAudioDestination) {
            this.audioWorkletNode?.disconnect(this.remoteAudioDestination);
          } else {
            this.audioWorkletNode?.disconnect(this.audioContext!.destination);
          }
        }
      };

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

  async playAudio(wsPayload: { type: string; data?: string; idx?: number }) {
    if (!this.audioContext) {
      this._logger?.error(
        this._logLabel,
        "Not audio context. It looks like connect() was not successful."
      );
      return {
        error: "Not audio context. It looks like connect() was not successful.",
      };
    }

    if (wsPayload.type == "audio") {
      const arrayBuffer = await toBytes(wsPayload.data!);
      this.audioWorkletNode?.port.postMessage({
        type: "arrayBuffer",
        buffer: arrayBuffer,
        idx: wsPayload.idx,
      });
    } else if (wsPayload.type == "audio_end") {
      this.audioWorkletNode?.port.postMessage({
        type: "audio_end",
      });
    }
  }

  stopPlayingAudio() {
    if (!this.audioWorkletNode) return;
    try {
      this.audioEndTime = new Date().getTime();
    } catch (error) {
      this._logger?.error(this._logLabel, "Error stopping audio", error);
    }
  }

  async disconnect() {
    this.recorder?.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.remoteAudioDestination = null;
    this.track = null;
  }

  getMetadata(): TResponse {
    if (!this.stream) {
      this._logger?.warn(this._logLabel, "No audio stream available");
      return { error: "No audio stream available" };
    }

    try {
      const audioSettings = this.stream.getTracks()[0].getSettings();

      this._logger?.info(this._logLabel, "Audio settings:", audioSettings);
      const inputAudioMetadata = {
        samplingRate: audioSettings.sampleRate || this.audioContext?.sampleRate,
        audioEncoding: "linear16",
      };

      return {
        ok: true,
        data: {
          inputSampleRate: inputAudioMetadata.samplingRate,
          outputSampleRate: this.audioContext?.sampleRate,
        },
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

  getRemoteAudioTrack(): TResponse<string, Track> {
    if (!this.audioContext) {
      return { error: "No audio context available" };
    }

    if (this.remoteAudioTrack) {
      return { ok: true, data: this.remoteAudioTrack };
    }

    try {
      this.remoteAudioDestination =
        this.audioContext.createMediaStreamDestination();
      const track = new Track(
        this.remoteAudioDestination.stream.getTracks()[0],
        ETrackOrigin.Remote
      );

      this.remoteAudioTrack = track;

      return { ok: true, data: this.remoteAudioTrack };
    } catch (error) {
      return { error: "Error creating remote audio destination" };
    }
  }
}
