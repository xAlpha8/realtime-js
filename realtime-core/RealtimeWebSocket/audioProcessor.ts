class AudioProcessor extends AudioWorkletProcessor {
    private audioData: Float32Array[];
    private index: number;
    private isTalking: boolean;
    private i: number;
    constructor() {
      super();
      this.port.onmessage = this.handleMessage.bind(this);
      this.audioData = [];
      this.index = 0;
      this.isTalking = false;
      this.i = 0;
    }
  
    /**
     * Handles incoming messages from the main thread.
     * @param {MessageEvent} event - The message event containing audio data.
     */
    async handleMessage(event: MessageEvent): Promise<void> {
      if (event.data.type === "b64_arrayBuffer") {
        try {
          // Decode the audio data
          // console.log("Decoding audio", this.i, event.data.audio);
          const audioData = await this.decodeAudio(event.data.buffer);
          this.audioData.push(audioData);
          this.i += 1;
        } catch (error) {
          this.port.postMessage({
            type: "error",
            message: "Audio decoding failed: " + error,
          });
          this.isTalking = false;
          this.port.postMessage("agent_stop_talking");
        }
      }
    }
  
    /**
     * Decodes the audio data from an ArrayBuffer.
     * @param {ArrayBuffer} arrayBuffer - The raw audio data.
     * @returns {Promise<Float32Array>} The decoded audio data.
     */
    async decodeAudio(b64ArrayBuffer: ArrayBuffer) {
      // Note: AudioContext is not available in AudioWorkletGlobalScope
      // We'll use a simple PCM decoder for this example
      // In a real-world scenario, you might want to use a more robust decoder library
      console.log("About to decode audio")
      try {
        const dataArray = new Uint8Array(b64ArrayBuffer);
        console.log("Converted to Uint8");
        const view = new DataView(dataArray.buffer);
        const pcmData = new Float32Array(dataArray.byteLength / 2);
        for (let i = 0; i < pcmData.length; i++) {
          pcmData[i] = view.getInt16(i * 2, true) / Math.pow(2, 16 - 1);
        }
        return pcmData;
      } catch (error) {
        console.error("Error decoding audio:", error);
        throw error; // Re-throw the error to be caught in the calling function
      }
    }
  
    // callback AudioWorkletProcessCallback =
    // boolean (FrozenArray<FrozenArray<Float32Array>> inputs,
    //   FrozenArray<FrozenArray<Float32Array>> outputs,
    //   object parameters);
    process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>
    ): boolean {
      const output = outputs[0];
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          if (this.audioData.length > 0) {
            if (!this.isTalking) {
              this.isTalking = true;
              this.port.postMessage("agent_start_talking");
            }
            outputChannel[i] = this.audioData[0][this.index];
            this.index++;
            if (this.index == this.audioData[0].length) {
              this.audioData.shift();
              this.index = 0;
            }
          } else {
            outputChannel[i] = 0;
            if (this.isTalking) {
              this.isTalking = false;
              this.port.postMessage("agent_stop_talking");
            }
          }
        }
      }
      return true;
    }
  }
  
  registerProcessor("audio-processor", AudioProcessor);
  