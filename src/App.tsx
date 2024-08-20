import React from "react";
import { TakeUserInput } from "./TakeUserInput";
import { TRealtimeConfig } from "../realtime-core";
import { RealtimeApp } from "./RealtimeApp";

import "./App.css";

export default function App() {
  const [config, setConfig] = React.useState<TRealtimeConfig | null>(null);

  return (
    <>
      {!config && <TakeUserInput onSubmit={(data) => setConfig(data)} />}
      {config && (
        <RealtimeApp config={config} onDisconnect={() => setConfig(null)} />
      )}
    </>
  );
}
