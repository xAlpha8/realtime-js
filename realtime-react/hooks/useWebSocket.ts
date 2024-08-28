import {
  IMediaRecorder,
  MediaRecorder,
  register,
} from "extendable-media-recorder";
import { connect as recorderConnect } from "extendable-media-recorder-wav-encoder";
import { blobToBase64, stringify } from "./utils";
import React, { useState, useRef, useEffect} from "react";
import {
  realtimeConnectionMachine,
  TRealtimeConnectionListener,
  ETrackKind,
  ETrackOrigin,
  TRealtimeConnectionListenerType,
  TRealtimeConfig,
  Track,
  WebSocketDataChannel,
} from "../../realtime-core";

export type TUseWebSocketOptions = {
  config: TRealtimeConfig;
};

export function useWebSocket(options: TUseWebSocketOptions) {
  const [dataChannel, setDataChannel] = React.useState<WebSocketDataChannel | null>(null);

  const { config } = options;

  const _eventListeners = React.useRef<
    Partial<
      Record<TRealtimeConnectionListenerType, TRealtimeConnectionListener[]>
    >
  >({});

  const _handleOnTrack = React.useCallback((event: unknown) => {
    throw new Error("Function not implemented.");
  }, []);

  const _registerEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ) => {
      if (_eventListeners.current[type]) {
        _eventListeners.current[type].push(listener);
      } else {
        _eventListeners.current[type] = [listener];
      }
    },
    []
  );

  const _unregisterEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ) => {
      if (!_eventListeners.current[type]) {
        return;
      }
      _eventListeners.current[type] = _eventListeners.current[type].filter(
        (fn) => fn !== listener
      );
    },
    []
  );

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [connectionState, setConnectionState] = useState<string>("idle")
  const [recorder, setRecorder] = useState<IMediaRecorder | null>(null)
  // Error state to capture and display errors
  const [error, setError] = React.useState<Error>();
  const [messages, setMessages] = useState<{ text: string }[]>([]); // Specify the type of messages
  const [audioQueue, setAudioQueue] = React.useState<(Buffer | string)[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const localAudioStream = useRef<Track | null>(null)
  const remoteAudioStream = useRef<Track | null>(null)
  const newAudioStartTime = useRef(0);

  const addEventListener = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const removeEventListener = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const recordingDataListener = ({ data }: { data: Blob }) => {
    blobToBase64(data).then((base64Encoded: string | null) => {
      if (!base64Encoded) return;
      const audioMessage = {
        type: "audio",
        data: base64Encoded,
      };
      // Send audio data to the server if the WebSocket is open
      socket!.readyState === WebSocket.OPEN &&
        socket!.send(stringify(audioMessage));
    });
  }

  const setupLocalAudioTrack = async() => {
    const constraints: MediaStreamConstraints = {};
    const audioConfig = this._config.audio;

    if (audioConfig) {
      constraints.audio = audioConfig;
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Add each track from the media stream to the peer connection.
    mediaStream.getTracks().forEach((track) => {
        const stream = new MediaStream([track]);
        const _trackInstance = new Track(track, ETrackOrigin.Local);
        if (track.kind === "audio") {
          localAudioStream.current = _trackInstance;
        }
      })
  }

  const setupRecorder = async () => {
    let recorderToUse = recorder;
    if (recorderToUse && recorderToUse.state === "paused") {
      recorderToUse.resume();
    } else if (!recorderToUse) {
      recorderToUse = new MediaRecorder(this.localStreams.audio[0], {
        mimeType: "audio/wav",
      });
      setRecorder(recorderToUse);
    }

    let timeSlice;
    timeSlice = 10;

    if (recorderToUse.state === "recording") {
      // When the recorder is in the recording state, see:
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/state
      // which is not expected to call `start()` according to:
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start.
      return;
    }
    recorderToUse.start(timeSlice);

    recorderToUse.addEventListener("dataavailable", recordingDataListener);
  }



  // Register WAV encoder for the media recorder
  React.useEffect(() => {
    const registerWav = async () => {
      await register(await recorderConnect());
    };
    registerWav().catch(console.error);
  }, []);

  // Effect to play queued audio
  React.useEffect(() => {
    const playArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
      console.log("playArrayBuffer", arrayBuffer);
      try {
        if (!audioContext) return;
        await audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          source.onended = () => {
            setProcessing(false);
          };
        });
      } catch (e) {
        console.error("Error playing audio", e);
        setProcessing(false);
        newAudioStartTime.current = 0;
      }
    };
    if (!processing && audioQueue.length > 0) {
      setProcessing(true);
      const audio = audioQueue.shift();
      if (typeof audio === "string" && audio === "audio_end") {
        newAudioStartTime.current = 0;
        setProcessing(false);
        console.log("Setting new audio start time to 0");
        return;
      } else if (audio instanceof Buffer && newAudioStartTime.current === 0) {
        newAudioStartTime.current = new Date().getTime() / 1000;
        console.log("New audio start time", newAudioStartTime.current);
      }
      audio &&
        fetch(URL.createObjectURL(new Blob([audio])))
          .then((response) => response.arrayBuffer())
          .then(playArrayBuffer);
    }
  }, [audioQueue, processing]);

  const _onOpen = async () => {
    if (!socket) return

    // create audio context
    const newAudioContext = new AudioContext();

    const destinationStream = newAudioContext.createMediaStreamDestination();
    const destinationTrack = destinationStream.stream.getAudioTracks()[0];
    newAudioContext.destination.connect(destinationStream);
    remoteAudioStream.current = new Track(destinationTrack, ETrackOrigin.Remote)

    setAudioContext(newAudioContext)

    // setup local input
    setupLocalAudioTrack()

    // send metadata to backend
    const micSettings = localAudioStream.current!.track.getSettings()
    console.log(micSettings);
    const inputAudioMetadata = {
      samplingRate: micSettings.sampleRate || newAudioContext.sampleRate,
      audioEncoding: "linear16",
    };

    socket.send(
      stringify({
        type: "audio_metadata",
        sampleRate: inputAudioMetadata.samplingRate,
      })
    );

    console.log("Input audio metadata", inputAudioMetadata);
    console.log("Output audio metadata", newAudioContext.sampleRate);

    // now setup the recorder to use with the sending of the tracks
    setupRecorder()

    // update connection state
    setConnectionState("connected")
  }

  const _onMessage = async (event) => {
  try{
    const message = JSON.parse(event.data);
      if (message.type === "audio") {
        setAudioQueue((prev) => [
          ...prev,
          Buffer.from(message.data, "base64"),
        ]);
      } else if (message.type === "message") {
        const messageData = JSON.parse(message.data);
        if (messageData?.text) {
          console.log("Received text", messageData.text);
        }
        setMessages((prev) => [...prev, messageData]);
      } else if (message.type === "audio_end") {
        setAudioQueue((prev) => [...prev, "audio_end"]);
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  }

  const _onClose = (ev) => {

  }

  const connect = () => {
    const newSocket = new WebSocket(config.functionURL!)
    setSocket(newSocket)

    newSocket.onopen = _onOpen
    newSocket.onmessage = _onMessage
    newSocket.onclose = _onClose
  }

  const disconnect = (error?: Error) => {
      setAudioQueue([]);
      if (error) {
        setError(error);
        setConnectionState("error");
      } else {
        setConnectionState("idle");
      }
      if (!recorder || !socket) return;
      recorder.stop();
      const stopMessage = {
        type: "websocket_stop",
      };
      socket.send(stringify(stopMessage));
      socket.close();
    };

  const getLocalTracks = () => {
    return localAudioStream.current ? [localAudioStream.current] : [];
  }

  const getLocalAudioTrack = () => {
    return localAudioStream.current || null
  }

  const getLocalVideoTrack = () => {
    throw new Error("Websocket connections don't have video track.");
  };

  const getRemoteTracks = () => {
    return remoteAudioStream.current ? [remoteAudioStream.current] : [];
  }

  const getRemoteAudioTrack = () => {
    return remoteAudioStream.current || null
  };

  const getRemoteVideoTrack = () => {
    throw new Error("Websocket connections don't have video track.");
  };

  const reset = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  return {
    connectionStatus: connectionState,
    connect,
    disconnect,
    reset,
    dataChannel,
    addEventListener,
    removeEventListener,
    getLocalAudioTrack,
    getLocalVideoTrack,
    getLocalTracks,
    getRemoteAudioTrack,
    getRemoteVideoTrack,
    getRemoteTracks,
  };
}