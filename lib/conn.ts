import { Config, RtTrack, RtTrackSchema } from "./hooks/types";

type WebRTCConnectionEvents = {
  statechange: (state: RTCPeerConnectionState) => void;
  message: (evt: MessageEvent) => void;
  track: (evt: RTCTrackEvent) => void;
  open: (evt: Event) => void;
  close: (evt: Event) => void;
};

async function delay(delayInms: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
}

async function retryableFetch(
  url: string | URL,
  params: RequestInit,
  attempts: number
) {
  let mult = 1;
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url, params);
      return res;
    } catch (err) {
      await delay(mult * 1000);
      mult *= 2;
      if (i == attempts - 1) {
        throw err;
      }
    }
  }
}

class RealtimeConnection {
  private readonly _config: Config | null = null;
  private controller = new AbortController();
  //   private tracks: Track[] = []

  private _sdpFilterCodec(kind: string, codec: string, realSdp: string) {
    var allowed = [];
    var rtxRegex = new RegExp("a=fmtp:(\\d+) apt=(\\d+)\r$");
    var codecRegex = new RegExp(
      "a=rtpmap:([0-9]+) " + this._escapeRegExp(codec)
    );
    var videoRegex = new RegExp("(m=" + kind + " .*?)( ([0-9]+))*\\s*$");

    var lines = realSdp.split("\n");

    var isKind = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("m=" + kind + " ")) {
        isKind = true;
      } else if (lines[i].startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        var match = lines[i].match(codecRegex);
        if (match) {
          allowed.push(parseInt(match[1]));
        }

        match = lines[i].match(rtxRegex);
        if (match && allowed.includes(parseInt(match[2]))) {
          allowed.push(parseInt(match[1]));
        }
      }
    }

    var skipRegex = "a=(fmtp|rtcp-fb|rtpmap):([0-9]+)";
    var sdp = "";

    isKind = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("m=" + kind + " ")) {
        isKind = true;
      } else if (lines[i].startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        var skipMatch = lines[i].match(skipRegex);
        if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
          continue;
        } else if (lines[i].match(videoRegex)) {
          sdp += lines[i].replace(videoRegex, "$1 " + allowed.join(" ")) + "\n";
        } else {
          sdp += lines[i] + "\n";
        }
      } else {
        sdp += lines[i] + "\n";
      }
    }

    return sdp;
  }

  private _escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }

  private async _negotiate(pc: RTCPeerConnection) {
    if (!this._config) {
      throw Error("Unintialized WebRTCConnection config");
    }
    const signal = this.controller.signal;

    const config = this._config;
    return pc
      .createOffer()
      .then((offer) => {
        // @ts-ignore
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        // wait for ICE gathering to complete
        return new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") {
            resolve();
          } else {
            function checkState() {
              if (pc.iceGatheringState === "complete") {
                pc.removeEventListener("icegatheringstatechange", checkState);
                resolve();
              }
            }
            pc.addEventListener("icegatheringstatechange", checkState, {
              signal,
            });
          }
        });
      })
      .then(async () => {
        if (config.functionUrl && config.functionUrl.length > 0) {
          const resp = await fetch(config.functionUrl);
          const payload = await resp.json();
          console.log("Connecting with : ", payload.address);
          return payload.address + "/offer";
        } else if (config.offerUrl && config.offerUrl.length > 0) {
          console.log("running offerURL");
          return config.offerUrl;
        } else {
          throw Error("Either offerURL or functionURL must be set");
        }
      })
      .then(async (offerUrl) => {
        var offer = pc.localDescription;
        var codec;

        if (!offer || !offerUrl) return;

        codec = config.audioCodec;
        if (codec !== "default") {
          // @ts-ignore
          const modifiedSDP = this._sdpFilterCodec("audio", codec, offer.sdp);
          offer = new RTCSessionDescription({
            type: offer.type,
            sdp: modifiedSDP,
          });
        }
        codec = config.videoCodec;
        if (codec !== "default") {
          // @ts-ignore
          const modifiedSDP = this._sdpFilterCodec("video", codec, offer.sdp);
          offer = new RTCSessionDescription({
            type: offer.type,
            sdp: modifiedSDP,
          });
        }

        console.log(offer.sdp);
        return retryableFetch(
          offerUrl,
          {
            body: JSON.stringify({
              sdp: offer.sdp,
              type: offer.type,
              video_transform: config.videoTransform,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          },
          7
        );
      })
      .then((response) => {
        return response?.json();
      })
      .then((answer) => {
        console.log(answer.sdp);
        return pc.setRemoteDescription(answer);
      })
      .catch((e) => {
        alert(e);
      });
  }

  private _setupPeerConnection(): RTCPeerConnection {
    if (!this.pc) {
      throw Error("Unintialized WebRTCConnection config");
    }
    const pc = this.pc;
    const signal = this.controller.signal;

    // register some listeners to help debugging
    pc.addEventListener(
      "icegatheringstatechange",
      () => {
        console.log(" -> " + pc.iceGatheringState);
      },
      { capture: false, signal: signal }
    );
    console.log(pc.iceGatheringState);

    pc.addEventListener(
      "iceconnectionstatechange",
      () => {
        console.log(" -> " + pc.iceConnectionState);
      },
      { capture: false, signal: signal }
    );
    console.log(pc.iceConnectionState);

    pc.addEventListener(
      "signalingstatechange",
      () => {
        console.log(" -> " + pc.signalingState);
      },
      { capture: false, signal: signal }
    );
    console.log(pc.signalingState);

    return pc;
  }

  constructor(config: Config) {
    this._config = config;
    var rtcConfig: RTCConfiguration = {
      // @ts-ignore
      sdpSemantics: "unified-plan",
    };

    if (config.useStun) {
      rtcConfig.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];
    }
    this.pc = new RTCPeerConnection(rtcConfig);
    this.dc = null;
  }

  pc: RTCPeerConnection | null = null;
  dc: RTCDataChannel | null = null;
  tracks: RtTrack[] = [];

  async connect() {
    console.log("Connecting");
    if (!this._config) {
      throw Error("Unintialized WebRTCConnection config");
    }

    var pc = this._setupPeerConnection();
    this.pc = pc;
    pc.addEventListener("track", (evt: RTCTrackEvent) => {
      this.tracks.push(
        RtTrackSchema.parse({
          kind: evt.track.kind,
          stream: evt.streams[0],
          track: evt.track,
        })
      );
    });
    var dc = null;

    if (this._config.isDataEnabled) {
      console.log(
        "Setting up data channel. isDataEnabled?",
        this._config.isDataEnabled
      );
      var parameters = this._config.dataParameters;
      dc = pc.createDataChannel("chat", parameters);
      this.dc = dc;
    }

    // Build media constraints.
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: false,
    };
    let screenShareConstraints: MediaTrackConstraints | null = null;

    if (this._config.isAudioEnabled) {
      const audioConstraints: boolean | MediaTrackConstraints = {};

      const device = this._config.audioInput;
      if (device) {
        audioConstraints.deviceId = { exact: device };
      }

      constraints.audio = Object.keys(audioConstraints).length
        ? audioConstraints
        : true;
    }

    if (this._config.isVideoEnabled) {
      const videoConstraints: boolean | MediaTrackConstraints = {};

      const device = this._config.videoInput;
      if (device) {
        videoConstraints.deviceId = { exact: device };
      }

      const resolution = this._config.videoResolution;
      if (resolution) {
        const dimensions = resolution.split("x");
        videoConstraints.width = parseInt(dimensions[0], 0);
        videoConstraints.height = parseInt(dimensions[1], 0);
      }

      constraints.video = Object.keys(videoConstraints).length
        ? videoConstraints
        : true;
    }

    if (this._config.isScreenShareEnabled) {
      screenShareConstraints = {};
      const resolution = this._config.videoResolution;
      if (resolution) {
        const dimensions = resolution.split("x");
        screenShareConstraints.width = parseInt(dimensions[0], 0);
        screenShareConstraints.height = parseInt(dimensions[1], 0);
      }
      screenShareConstraints.frameRate = { max: 5 };
    }

    // Acquire media and start negociation.

    if (
      constraints.audio ||
      constraints.video ||
      this._config.isScreenShareEnabled
    ) {
      const addTracks = [];
      console.log("constraints", constraints);
      console.log("screen share", this._config.isScreenShareEnabled);
      if (constraints.audio || constraints.video) {
        addTracks.push(
          navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            stream.getTracks().forEach((track) => {
              console.log("[audio/video] Adding track");
              //   if (pc.connectionState == "connected") {
              pc.addTrack(track, stream);
              //   }
            });
          })
        );
      } else {
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

      if (this._config.isScreenShareEnabled) {
        addTracks.push(
          navigator.mediaDevices
            .getDisplayMedia({
              video: screenShareConstraints!,
            })
            .then((stream) => {
              stream.getTracks().forEach((track) => {
                console.log("[screenshare] Adding track");
                // if (pc.connectionState == "connected") {
                pc.addTrack(track, stream);
                // }
              });
            })
        );
      }

      await Promise.all(addTracks)
        .then(() => this._negotiate(pc))
        .catch((err) => alert("Could not acquire media" + err));
    } else {
      this._negotiate(pc);
    }
    // document.getElementById('stop').style.display = 'inline-block';
  }

  disconnect() {
    console.log("Disconnecting");
    // this.controller.abort()
    // close data channel
    if (this.dc) {
      this.dc.close();
    }

    // close transceivers
    if (this.pc) {
      this.pc.getTransceivers().forEach((transceiver) => {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });

      // close local audio / video
      this.pc.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      // close peer connection
      setTimeout(() => {
        // @ts-ignore
        this.pc.close();
      }, 500);
    }
  }

  on<E extends keyof WebRTCConnectionEvents>(
    event: E,
    callback: WebRTCConnectionEvents[E]
  ) {
    if (!this.pc) {
      throw Error("Unintialized WebRTCConnection config");
    }
    const pc = this.pc;
    if (event == "track") {
      console.log("Adding track event listener");
      pc.addEventListener("track", callback as WebRTCConnectionEvents["track"]);
      return;
    } else if (event == "statechange") {
      pc.addEventListener("connectionstatechange", () => {
        const stateChangeCallback =
          callback as WebRTCConnectionEvents["statechange"];
        stateChangeCallback(pc.connectionState);
      });
      return;
    }

    if (!this.dc) {
      throw Error(
        "Unitialized WebRTCDataChannel. Did you enable data channel in config?"
      );
    }

    const dc = this.dc;
    switch (event) {
      case "message":
        dc.addEventListener(
          "message",
          callback as WebRTCConnectionEvents["message"]
        );
        break;
      case "open":
        dc.addEventListener("open", callback as WebRTCConnectionEvents["open"]);
        break;
      case "close":
        dc.addEventListener(
          "close",
          callback as WebRTCConnectionEvents["close"]
        );
        break;
      default:
        throw new Error("Unsupported Event Type");
    }
  }

  off<E extends keyof WebRTCConnectionEvents>(
    event: E,
    callback: WebRTCConnectionEvents[E]
  ) {
    if (!this.pc) {
      throw Error("Uninitialized WebRTCConnection config");
    }
    const pc = this.pc;
    if (event == "track") {
      pc.removeEventListener(
        "track",
        callback as WebRTCConnectionEvents["track"]
      );
      return;
    } else if (event == "statechange") {
      return;
    }
    if (!this.dc) {
      throw Error(
        "Uninitialized WebRTCDataChannel. Did you enable data channel in config?"
      );
    }

    const dc = this.dc;
    switch (event) {
      case "message":
        dc.removeEventListener(
          "message",
          callback as WebRTCConnectionEvents["message"]
        );
        break;
      case "open":
        dc.removeEventListener(
          "open",
          callback as WebRTCConnectionEvents["open"]
        );
        break;
      case "close":
        dc.removeEventListener(
          "close",
          callback as WebRTCConnectionEvents["close"]
        );
        break;
      default:
        throw new Error("Unsupported Event Type");
    }
  }

  async send(message: string) {
    if (!this.dc) {
      throw Error(
        "Unitialized WebRTCDataChannel. Did you enable data channel in config?"
      );
    }
    if (this.dc.readyState !== "open") {
      throw Error("Connection not ready. Did you call `connect` method?");
    }
    if (typeof message !== "string") {
      throw Error("Message must be a string");
    }
    this.dc.send(message);
  }
}

class WebRTCConnectionManager {
  private static _conn: RealtimeConnection | null = null;
  private static _config: Config | null = null;

  static setConfig = (config: Config) => {
    WebRTCConnectionManager._config = config;
    if (WebRTCConnectionManager._conn) {
      WebRTCConnectionManager._conn.disconnect();
    }
  };

  static get = () => {
    const config = WebRTCConnectionManager._config;

    if (config == null) {
      throw new Error("Config is unset. Use `setConfig` method to set config.");
    }

    if (WebRTCConnectionManager._conn == null) {
      const conn = new RealtimeConnection(config);
      WebRTCConnectionManager._conn = conn;
      return conn;
    }
    return WebRTCConnectionManager._conn;
  };
}

export { WebRTCConnectionManager, RealtimeConnection };
