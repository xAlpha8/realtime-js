import { useWebRTC } from "../realtime-react/hooks";

import React from "react";
import { RealtimeAudio, RealtimeVideo } from "../realtime-react";
import { TRealtimeConfig } from "../realtime-core";
import { Chat } from "./Chat";

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
    getRemoteVideoTrack,
    getRemoteAudioTrack,
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

  if (connectionStatus === "Failed") {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <div className="flex flex-col flex-1 max-h-[700px] h-full max-w-2xl border rounded-[4px] border-[#333] p-4 space-y-4">
          <div className="flex flex-col justify-center items-center flex-1 border rounded-[4px] border-[#333] p-4">
            <span>Failed to connect</span>
          </div>

          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="flex flex-col flex-1 max-h-[700px] h-full max-w-2xl border rounded-[4px] border-[#333] p-4 space-y-4">
        <div className="flex flex-col justify-center items-center flex-1 border rounded-[4px] border-[#333]">
          {connectionStatus === "Connected" && (
            <>
              <RealtimeVideo track={getRemoteVideoTrack()} />
              <div className="hidden">
                <RealtimeAudio track={getRemoteAudioTrack()} />
              </div>
            </>
          )}
          {connectionStatus === "Connecting" && <span>Connecting...</span>}
        </div>
        {!dataChannel && (
          <div className="w-full h-[60px] animate-pulse bg-gray-300 rounded-[8px]"></div>
        )}
        {dataChannel && <Chat dataChannel={dataChannel} />}
      </div>
    </div>
  );
}
