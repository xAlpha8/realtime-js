import { useAvailableMediaDevices, useWebSocket } from "../realtime-react";

import "./App.css";
import { ConsoleLogger } from "../realtime-core";
import React from "react";

export default function App() {
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const { availableAudioDevices } = useAvailableMediaDevices();

  const { connect, disconnect } = useWebSocket({
    config: {
      audio: {
        deviceId: audioDeviceId,
        echoCancellation: true,
      },
      functionURL:
        "https://us0-dev.getadapt.ai/run/eb7bf856460c223978795a96d2cd2073",
      logger: ConsoleLogger.getLogger(),
    },
  });

  return (
    <div>
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
