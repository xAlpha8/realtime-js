import React from "react";
import { TRealtimeWebSocketConfig } from "@adaptai/realtime-react";

import { TakeUserInput } from "./TakeUserInput";
import { Websocket } from "./Websocket";

export function WebsocketApp() {
  const [config, setConfig] = React.useState<TRealtimeWebSocketConfig | null>(
    null)

  // const [audioDeviceId, setAudioDeviceId] = React.useState("");
  // const [functionURL, setFunctionURL] = React.useState(
  //   // TODO: Update it with some hosted functionURL.
  //   "http://localhost:8080/"
  // );
  // const { availableAudioDevices } = useAvailableMediaDevices();
  // const [localAudioVolume, setLocalAudioVolume] = React.useState(0);
  // const recvAudioCount = React.useRef(0)

  // const {
  //   connect,
  //   disconnect,
  //   getRemoteAudioTrack,
  //   getLocalAudioTrack,
  //   connection,
  //   connectionStatus,
  // } = useWebSocket({
  //   config: {
  //     audio: {
  //       deviceId: audioDeviceId,
  //       echoCancellation: true,
  //     },
  //     functionURL,
  //     logger: ConsoleLogger.getLogger(),
  //   },
  // });

  // const onMessage = React.useCallback(
  //   (event: unknown) => {
  //     if (!isMessageEvent(event)) return;
  //     ConsoleLogger.getLogger().info("Messages", "Received Message.");

  //     const msg = JSON.parse(event.data);
  //     if (msg.type === "audio") {
  //       recvAudioCount.current += 1
  //       connection?.mediaManager.playAudio({ ...msg, idx: recvAudioCount.current });
  //     } else if (msg.type == "audio_end") {
  //       connection?.mediaManager.playAudio(msg);
  //     }
  //   },
  //   [connection]
  // );

  function onSubmit(config: TRealtimeWebSocketConfig) {
    setConfig(config);
  }

  function onDisconnect() {
    setConfig(null);
  }

  return (
    <>
      {!config && <TakeUserInput onSubmit={onSubmit} />}
      {config && <Websocket config={config} onDisconnect={onDisconnect} />}
    </>
  );
}
