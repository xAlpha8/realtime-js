import React from "react";
import { TRealtimeConfig } from "@adaptai/realtime";

import { TakeUserInput } from "./TakeUserInput";
import { RealtimeApp } from "./RealtimeApp";

import "./App.css";

export default function App() {
  const [config, setConfig] = React.useState<TRealtimeConfig | null>(null);

  function onSubmit(config: TRealtimeConfig) {
    setConfig(config);
  }

  function onDisconnect() {
    setConfig(null);
  }

  return (
    <>
      {!config && <TakeUserInput onSubmit={onSubmit} />}
      {config && <RealtimeApp config={config} onDisconnect={onDisconnect} />}
    </>
  );
}
