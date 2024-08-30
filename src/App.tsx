import React from "react";
import { TakeUserInput } from "./TakeUserInput";

import { RealtimeApp } from "./RealtimeApp";

import "./App.css";
import { TRealtimeConfig } from "../realtime-core";
import { Toaster } from "react-hot-toast";

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
      <Toaster />
    </>
  );
}
