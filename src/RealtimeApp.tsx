import { useRealtime } from "../realtime-react/hooks/useRealtime";
import React from "react";
import { TRealtimeConfig } from "../realtime-core/shared/@types";
import { RtAudio, RtAudioVisualizer, RtChat, RtVideo } from "../lib";

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
    getLocalStream,
    remoteStreams,
  } = useRealtime();

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
    <div className="container">
      <div className="status-bar">
        Connection Status: {connectionStatus}
        <button onClick={disconnect}>Disconnect</button>
      </div>
      <RtVideo remoteStreams={[getLocalStream("video").data!]} />
      <div className="audio-container">
        <RtAudioVisualizer remoteStreams={remoteStreams} />
        <RtAudio remoteStreams={remoteStreams} />
      </div>
      <RtChat
        addEventListeners={addEventListener}
        removeEventListeners={removeEventListener}
      />
    </div>
  );
}
