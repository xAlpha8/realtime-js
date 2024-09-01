import React from "react";
import {
  useWebRTC,
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeChat,
  RealtimeVideo,
  TRealtimeConfig,
} from "@adaptai/realtime";

export type TRealtimeAppProps = {
  onDisconnect: () => void;
  config: TRealtimeConfig;
};

export function RealtimeApp(props: TRealtimeAppProps) {
  const { config, onDisconnect } = props;
  const {
    connectionStatus,
    connect,
    disconnect,
    getRemoteAudioTrack,
    getRemoteVideoTrack,
    getLocalVideoTrack,
    dataChannel,
  } = useWebRTC({ config });

  React.useEffect(() => {
    switch (connectionStatus) {
      case "SetupCompleted":
        connect();
        break;
      case "Disconnected":
        onDisconnect();
        break;
    }

    if (connectionStatus === "Failed") {
      console.log("Something went wrong, please try again");
    }
  }, [connectionStatus, connect, onDisconnect, config]);

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
      <RealtimeVideo track={getRemoteVideoTrack()} />
      <RealtimeVideo track={getLocalVideoTrack()} />
      <div className="audio-container">
        <RealtimeAudio track={getRemoteAudioTrack()} />
        <RealtimeAudioVisualizer track={getRemoteAudioTrack()} />
      </div>
      {dataChannel && <RealtimeChat dataChannel={dataChannel} />}
    </div>
  );
}
