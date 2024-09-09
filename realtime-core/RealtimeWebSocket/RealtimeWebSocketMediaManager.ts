import {
  IMediaRecorder,
  MediaRecorder,
  register,
} from "extendable-media-recorder";
import { connect as wavEncodedConnect } from "extendable-media-recorder-wav-encoder";

import { ETrackOrigin, Track } from "../shared/Track";
import { TLogger, TRealtimeWebSocketConfig, TResponse } from "../shared/@types";
import { toBytes } from 'fast-base64';
import audioProcessorUrl from "./audioProcessor.ts?url";
console.log(audioProcessorUrl)


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
  audioWorkletNode: AudioWorkletNode | null

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

      const audioContext = new AudioContext();
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
      this._logger?.info(this._logLabel, "Created Audio context")
      // setup audioWorklet
      await this.audioContext.audioWorklet.addModule(audioProcessorUrl)
      this._logger?.info(this._logLabel, "Added audio worklet module")

      this.audioWorkletNode = new AudioWorkletNode(audioContext, "audio-processor")
      // this.audioWorkletNode.connect(audioContext.destination)
      this.audioWorkletNode.onprocessorerror = (ev: Event) => {
        // console.error('AudioWorklet processor error:', ev);
        this._logger?.error(this._logLabel, 'AudioWorklet processor error:', ev);
      }

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

  async playAudio(base64EncodedAudio: string): Promise<TResponse> {
    if (!this.audioContext) {
      this._logger?.error(
        this._logLabel,
        "Not audio context. It looks like connect() was not successful."
      );
      return {
        error: "Not audio context. It looks like connect() was not successful.",
      };
    }

    console.log(`Base64 string size: ${base64EncodedAudio.length} bytes`);

    const arrayBuffer = await toBytes(base64EncodedAudio);
    console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

    this.audioWorkletNode?.port.postMessage({
      type: "b64_arrayBuffer",
      buffer: arrayBuffer
    })

    // if (this.isPlaying) {
    //   this.stopPlayingAudio();
    //   // Waiting for one second so that it feels natural.
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }

    try {
      this.isPlaying = true;
      this.audioContext.resume();
      // const buffer = await this.audioContext.decodeAudioData(audioBuffer);
      // this.source = this.audioContext.createBufferSource();
      // this.source.buffer = buffer;
      if (this.remoteAudioDestination) {
        this.audioWorkletNode?.connect(this.remoteAudioDestination)
        // this.source.connect(this.remoteAudioDestination);
      } else {
        this.audioWorkletNode?.connect(this.audioContext.destination)
        // this.source.connect(this.audioContext.destination);
      }
      // TODO: start playing audio here
      this.audioStartTime = new Date().getTime() / 1000;
      this._logger?.info(this._logLabel, "Playing audio");

    } catch (error) {
      this.isPlaying = false;
      this._logger?.error(this._logLabel, "Error playing audio", error);

      return {
        error,
      };
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.audioWorkletNode) {
           const runOnEnd = () => {
            this.isPlaying = false;
            this.audioEndTime = new Date().getTime() / 1000;

            // if (
            //   this.audioContext &&
            //   this.source instanceof AudioBufferSourceNode
            // ) {
            //   if (this.remoteAudioDestination) {
            //     this.source.disconnect(this.remoteAudioDestination);
            //   } else {
            //     this.source.disconnect(this.audioContext.destination);
            //   }
            // }

            resolve({ ok: true });
          };
          runOnEnd() // TODO
        }
      } catch (error) {
        this.isPlaying = false;
        this._logger?.error(this._logLabel, "Error playing audio", error);
        reject({ error });
      }
    });
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
      const metadata = {
        samplingRate: audioSettings.sampleRate || this.audioContext?.sampleRate,
        audioEncoding: "linear16",
      };

      return {
        ok: true,
        data: metadata,
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
