import { useWebRTC } from "../realtime-react/hooks";
import React from "react";
import {
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeChat,
  RealtimeVideo,
} from "../realtime-react";
import { TRealtimeConfig } from "../realtime-core";

export type TRealtimeAppProps = {
  onDisconnect: () => void;
  config: TRealtimeConfig;
};

export function RealtimeApp(props: TRealtimeAppProps) {
  const { config, onDisconnect } = props;
  const {
    connectionStatus,
    connect,
    addOnPacketReceiveListener,
    disconnect,
    getRemoteAudioTracks,
    getRemoteVideoTracks,
    dataChannel,
  } = useWebRTC({ config });

  React.useEffect(() => {
    switch (connectionStatus) {
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
    onDisconnect,
    addOnPacketReceiveListener,
    config,
  ]);

  function handleDisconnect() {
    if (connectionStatus === "Connected") {
      disconnect();
    }

    onDisconnect();
  }

  return (
    <div className="container">
      <div className="status-bar">
        Connection Status: {connectionStatus}
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
      <RealtimeVideo tracks={getRemoteVideoTracks()} />
      <div className="audio-container">
        <RealtimeAudioVisualizer tracks={getRemoteAudioTracks()} />
        <RealtimeAudio tracks={getRemoteAudioTracks()} />
      </div>
      {dataChannel && <RealtimeChat dataChannel={dataChannel} />}
    </div>
  );
}
