import { useAvailableMediaDevices, useWebSocket } from "../realtime-react";

import "./App.css";
import { ConsoleLogger } from "../realtime-core";
import React from "react";

export default function App() {
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const [functionURL, setFunctionURL] = React.useState(
    "https://infra.getadapt.ai/run/68deae870da28f99a8562dcb962b9383"
  );
  const { availableAudioDevices } = useAvailableMediaDevices();

  const { connect, disconnect } = useWebSocket({
    config: {
      audio: {
        deviceId: audioDeviceId,
        echoCancellation: true,
      },
      functionURL,
      logger: ConsoleLogger.getLogger(),
    },
  });

  return (
    <div>
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
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
