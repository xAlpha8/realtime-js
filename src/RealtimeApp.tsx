import { useRealtime } from "../realtime-react/hooks/useRealtime";
import React from "react";
import { TMedia, TRealtimeConfig } from "../realtime-core/shared/@types";
import { isMessageEvent } from "../realtime-core/utils";

export type TRealtimeAppProps = {
  config: TRealtimeConfig;
  onDisconnect: () => void;
};

export function RealtimeApp(props: TRealtimeAppProps) {
  const { config, onDisconnect } = props;

  const {
    addEventListener,
    removeEventListener,
    connect,
    reset,
    disconnect,
    setup,
    connectionStatus,
    remoteStreams,
  } = useRealtime();
  const [remoteAudio, setRemoteAudio] = React.useState<TMedia | null>(null);

  const onMessage = React.useCallback((e: unknown) => {
    if (!isMessageEvent(e)) {
      return;
    }
    console.log("Message", e.data);
  }, []);

  React.useEffect(() => {
    addEventListener("message", onMessage);
    return () => {
      removeEventListener("message", onMessage);
    };
  }, [addEventListener, removeEventListener, onMessage]);
  React.useEffect(() => {
    remoteStreams.forEach((media) => {
      if (media.track.kind === "audio") {
        setRemoteAudio(media);
      }
    });
  }, [remoteStreams]);
  React.useEffect(() => {
    switch (connectionStatus) {
      case "Init":
        setup(config);
        break;
      case "SetupCompleted":
        connect();
        break;
      case "Disconnected":
        reset();
        onDisconnect();
        break;
    }

    if (connectionStatus === "Failed") {
      console.log("Something went wrong, please try again");
      reset();
    }
  }, [connectionStatus, connect, reset, setup, config, onDisconnect]);

  return (
    <div>
      <div>Connection Status: {connectionStatus}</div>
      {connectionStatus === "Failed" && <div>Failed to connect </div>}
      <button onClick={disconnect}>Disconnect</button>
      {remoteAudio && <AudioPlayer audioStream={remoteAudio} />}
    </div>
  );
}

function AudioPlayer({ audioStream }: { audioStream?: TMedia | null }) {
  const ref = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    console.log("Stream", audioStream);
    if (!ref.current) {
      console.log("Ref is not defined");
      return;
    }

    if (!audioStream) {
      console.log("Audio stream is not defined");
      return;
    }

    ref.current.srcObject = audioStream.stream;
  }, [audioStream]);

  return (
    <div>
      Audio
      <audio ref={ref} autoPlay />
    </div>
  );
}
