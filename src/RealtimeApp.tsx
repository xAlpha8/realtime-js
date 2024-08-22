import { TUseRealtimeReturn } from "../realtime-react/hooks/useRealtime";
import React from "react";
import {
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeChat,
  RealtimeVideo,
} from "../realtime-react";

export type TRealtimeAppProps = Omit<TUseRealtimeReturn, "variables"> & {
  onDisconnect: () => void;
};

export function RealtimeApp(props: TRealtimeAppProps) {
  const {
    addEventListener,
    addOnPacketReceiveListener,
    removeEventListener,
    connect,
    disconnect,
    setup,
    connectionStatus,
    remoteStreams,
    sendMessage,
    onDisconnect,
  } = props;

  React.useEffect(() => {
    switch (connectionStatus) {
      case "Init":
        setup();
        break;
      case "SetupCompleted":
        addOnPacketReceiveListener((event) => {
          if (event.kind !== "audio") {
            // Only logging if we have timestamp for audio.
            return;
          }

          console.log("Previous", event.prevSource?.timestamp);
          console.log("Current", event.source.timestamp);
          console.log(
            "Diff",
            event.source.timestamp - (event.prevSource?.timestamp || 0)
          );
        });
        connect();
        break;
      case "Disconnected":
        onDisconnect();
        break;
    }

    if (connectionStatus === "Failed") {
      console.log("Something went wrong, please try again");
    }
  }, [
    connectionStatus,
    connect,
    setup,
    onDisconnect,
    addOnPacketReceiveListener,
  ]);

  return (
    <div className="container">
      <div className="status-bar">
        Connection Status: {connectionStatus}
        <button onClick={disconnect}>Disconnect</button>
      </div>
      <RealtimeVideo remoteStreams={remoteStreams} />
      <div className="audio-container">
        <RealtimeAudioVisualizer remoteStreams={remoteStreams} />
        <RealtimeAudio remoteStreams={remoteStreams} />
      </div>
      <RealtimeChat
        addEventListeners={addEventListener}
        removeEventListeners={removeEventListener}
        sendMessage={sendMessage}
      />
    </div>
  );
}
