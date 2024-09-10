import React from "react";
import {
  useAvailableMediaDevices,
  useWebSocket,
  isMessageEvent,
  ConsoleLogger,
  RealtimeAudio,
} from "@adaptai/realtime-react";

export function WebsocketApp() {
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const [functionURL, setFunctionURL] = React.useState(
    // TODO: Update it with some hosted functionURL.
    "http://localhost:8080/"
  );
  const { availableAudioDevices } = useAvailableMediaDevices();
  const [localAudioVolume, setLocalAudioVolume] = React.useState(0);
  const recvAudioCount = React.useRef(0)

  const {
    connect,
    disconnect,
    getRemoteAudioTrack,
    getLocalAudioTrack,
    connection,
    connectionStatus,
  } = useWebSocket({
    config: {
      audio: {
        deviceId: audioDeviceId,
        echoCancellation: true,
      },
      functionURL,
      logger: ConsoleLogger.getLogger(),
    },
  });

  const onMessage = React.useCallback(
    (event: unknown) => {
      if (!isMessageEvent(event)) return;
      ConsoleLogger.getLogger().info("Messages", "Received Message.");

      const msg = JSON.parse(event.data);
      if (msg.type === "audio") {
        recvAudioCount.current += 1
        connection?.mediaManager.playAudio({ ...msg, idx: recvAudioCount.current });
      } else if (msg.type == "audio_end") {
        connection?.mediaManager.playAudio(msg);
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

  return (
    <div>
      <div>Connection Status: {connectionStatus}</div>
      <input
        value={functionURL}
        onChange={(e) => setFunctionURL(e.currentTarget.value)}
      />
      <select
        value={audioDeviceId}
        onChange={(e) => setAudioDeviceId(e.target.value)}
      >
        {availableAudioDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || device.deviceId}
          </option>
        ))}
      </select>

      <button
        onClick={connect}
        disabled={
          connectionStatus === "connected" || connectionStatus === "connecting"
        }
      >
        Connect
      </button>
      <button
        onClick={disconnect}
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
