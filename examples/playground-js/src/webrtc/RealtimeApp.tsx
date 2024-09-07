import React from "react";
import {
  useWebRTC,
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeChat,
  RealtimeVideo,
  TRealtimeConfig,
} from "@adaptai/realtime-react";
import { VideoSection } from "./VideoSection";
import { Loader2 } from "lucide-react";
import { Button } from "../components/button";

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
    getLocalAudioTrack,
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

  if (connectionStatus === "Connecting")
    return (
      <div className="h-full flex flex-1 justify-center items-center">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );

  if (connectionStatus === "Failed") {
    return (
      <div className="h-full flex flex-1 justify-center items-center">
        <div className="flex items-center space-y-4 flex-col">
          <h2 className="text-3xl font-light">
            Failed to connect. Please try again.
          </h2>
          <Button
            className="inline-flex max-w-24"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-1">
      <div className="flex-1 flex">
        <VideoSection
          onCallEndClick={handleDisconnect}
          localTrack={getLocalVideoTrack()}
          remoteTrack={getRemoteVideoTrack()}
          localAudioTrack={getLocalAudioTrack()}
          remoteAudioTrack={getRemoteAudioTrack()}
        />
      </div>
      <div className="w-[300px] ">{/* TODO add chat section. */}</div>
    </div>
  );
}
