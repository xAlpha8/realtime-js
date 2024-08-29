import { useWebRTC } from "../realtime-react/hooks";

import React from "react";
import {
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeVideo,
} from "../realtime-react";
import { TRealtimeConfig } from "../realtime-core";
import { AppHeader } from "./Header";
import { Chat } from "./Chat";

export type TRealtimeAppProps = {
  onDisconnect: () => void;
  config: TRealtimeConfig;
};

export function RealtimeApp(props: TRealtimeAppProps) {
  const { config, onDisconnect } = props;
  const [isRemoteVideoVisible, setIsRemoteVideoVisible] = React.useState(true);
  const [isLocalVideoVisible, setIsLocalVideoVisible] = React.useState(true);
  const [isRemoteAudioMute, setIsRemoteAudioMute] = React.useState(false);
  const [isLocalAudioMute, setIsLocalAudioMute] = React.useState(false);

  const {
    connectionStatus,
    connect,
    disconnect,
    getRemoteAudioTrack,
    getRemoteVideoTrack,
    getLocalAudioTrack,
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

  function userVideo() {
    if (isLocalVideoVisible) {
      setIsLocalVideoVisible(false);
      getLocalVideoTrack()?.pause();
    } else {
      setIsLocalVideoVisible(true);
      getLocalVideoTrack()?.resume();
    }
  }

  function userAudio() {
    if (isLocalAudioMute) {
      setIsLocalAudioMute(false);
      getLocalAudioTrack()?.resume();
    } else {
      setIsLocalAudioMute(true);
      getLocalAudioTrack()?.pause();
    }
  }

  function avatarVideo() {
    if (isRemoteVideoVisible) {
      setIsRemoteVideoVisible(false);
      getRemoteVideoTrack()?.pause();
    } else {
      setIsRemoteVideoVisible(true);
      getRemoteVideoTrack()?.resume();
    }
  }

  function avatarAudio() {
    if (isRemoteAudioMute) {
      setIsRemoteAudioMute(false);
      getRemoteAudioTrack()?.resume();
    } else {
      setIsRemoteAudioMute(true);
      getRemoteAudioTrack()?.pause();
    }
  }

  return (
    <div className="flex h-screen w-screen justify-center">
      <div className="flex flex-col max-w-[1400px] flex-1">
        <AppHeader status={connectionStatus} onDisconnect={handleDisconnect} />
        <div className="flex flex-1 space-x-5">
          <div className="flex flex-1 flex-col space-y-4">
            <div className="flex-1 flex">
              {isRemoteVideoVisible && connectionStatus === "Connected" && (
                <RealtimeVideo track={getRemoteVideoTrack()} />
              )}
              {!isRemoteVideoVisible && (
                <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center"></div>
              )}
              {connectionStatus === "Connecting" && (
                <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center animate-pulse">
                  Loading...
                </div>
              )}
            </div>

            {connectionStatus === "Connected" && (
              <div className="flex space-x-2 justify-between py-2">
                <div className="space-x-2">
                  <button onClick={userVideo}>
                    Turn {isLocalVideoVisible ? "off" : "on"} user video
                  </button>
                  <button onClick={userAudio}>
                    Turn {!isLocalAudioMute ? "off" : "on"} user audio
                  </button>
                </div>
                <div className="space-x-2">
                  <button onClick={avatarVideo}>
                    Turn {isRemoteVideoVisible ? "off" : "on"} avatar video
                  </button>
                  <button onClick={avatarAudio}>
                    Turn {!isRemoteAudioMute ? "off" : "on"} avatar audio
                  </button>
                </div>
              </div>
            )}
            {connectionStatus === "Connecting" && (
              <div className="h-[60px] w-full py-4">
                <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center animate-pulse">
                  Loading...
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex max-w-[200px]">
            <div className="space-y-4 flex flex-col flex-1 mb-20">
              <div className="h-56 w-full">
                {isLocalVideoVisible && connectionStatus === "Connected" && (
                  <RealtimeVideo track={getLocalVideoTrack()} />
                )}
                {!isLocalVideoVisible && (
                  <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center"></div>
                )}
                {connectionStatus === "Connecting" && (
                  <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center animate-pulse">
                    Loading...
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="rounded-[16px] overflow-hidden">
                  {!isLocalAudioMute && connectionStatus === "Connected" && (
                    <RealtimeAudioVisualizer track={getLocalAudioTrack()} />
                  )}
                  {isLocalAudioMute && (
                    <div className="bg-gray-600 h-[120px] w-full rounded-[8px] flex justify-center items-center"></div>
                  )}
                  {connectionStatus === "Connecting" && (
                    <div className="bg-gray-600 h-[120px] w-full rounded-[8px] flex justify-center items-center animate-pulse">
                      Loading..
                    </div>
                  )}
                </div>
                <div className="rounded-[16px] overflow-hidden">
                  {!isRemoteAudioMute && connectionStatus === "Connected" && (
                    <>
                      <RealtimeAudioVisualizer track={getRemoteAudioTrack()} />
                      <div className="hidden">
                        <RealtimeAudio track={getRemoteAudioTrack()} />
                      </div>
                    </>
                  )}
                  {isRemoteAudioMute && (
                    <div className="bg-gray-600 h-[120px] w-full rounded-[8px] flex justify-center items-center"></div>
                  )}
                  {connectionStatus === "Connecting" && (
                    <div className="bg-gray-600 h-[120px] w-full rounded-[8px] flex justify-center items-center animate-pulse">
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[300px] flex-1 pb-20 overflow-auto">
            {!dataChannel && connectionStatus !== "Failed" && (
              <div className="bg-gray-600 h-full w-full rounded-[8px] flex justify-center items-center animate-pulse">
                Loading...
              </div>
            )}
            {dataChannel && <Chat dataChannel={dataChannel} />}
          </div>
        </div>
      </div>
    </div>
  );
}
