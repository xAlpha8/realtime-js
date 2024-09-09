import React from "react";
import {
  useWebSocket,
  isMessageEvent,
  ConsoleLogger,
  RealtimeAudio,
  TRealtimeWebSocketConfig,
} from "@adaptai/realtime-react";

export type TWebsocketProps = {
  onDisconnect: () => void;
  config: TRealtimeWebSocketConfig;
};

export function Websocket(props: TWebsocketProps) {
  const { config, onDisconnect } = props;

  const [localAudioVolume, setLocalAudioVolume] = React.useState(0);

  const {
    connect,
    disconnect,
    getRemoteAudioTrack,
    getLocalAudioTrack,
    connection,
    connectionStatus,
  } = useWebSocket({
    config,
  });

  const handleDisconnect = React.useCallback(() => {
    disconnect();
    onDisconnect();
  }, [disconnect, onDisconnect]);

  const onMessage = React.useCallback(
    (event: unknown) => {
      if (!isMessageEvent(event)) return;
      ConsoleLogger.getLogger().info("Messages", "Received Message.");

      const msg = JSON.parse(event.data);
      if (msg.type === "audio") {
        connection?.mediaManager.playAudio(msg.data);
      }
    },
    [connection]
  );

  React.useEffect(() => {
    if (connection && connectionStatus === "connected") {
      connection.dataChannel?.addEventListener("message", onMessage);
    }

    return () => {
      if (connection) {
        connection.dataChannel?.removeEventListener("message", onMessage);
      }
    };
  }, [connection, onMessage, connectionStatus]);

  React.useEffect(() => {
    connect();
  }, []);

  return (
    <div>
      <div>Connection Status: {connectionStatus}</div>

      <button
        onClick={connect}
        disabled={
          connectionStatus === "connected" || connectionStatus === "connecting"
        }
      >
        Connect
      </button>
      <button
        onClick={handleDisconnect}
        disabled={
          connectionStatus === "disconnected" ||
          connectionStatus === "failed" ||
          connectionStatus === "new"
        }
      >
        Disconnect
      </button>

      <div>
        <span>Remote Audio controller</span>
        <RealtimeAudio track={getRemoteAudioTrack()} />
      </div>

      <div>
        <span>Local audio controller</span>
        <input
          placeholder="Local audio volume"
          value={localAudioVolume}
          onChange={(e) => setLocalAudioVolume(+e.target.value)}
        />
        <RealtimeAudio track={getLocalAudioTrack()} volume={localAudioVolume} />
      </div>
    </div>
  );
}
