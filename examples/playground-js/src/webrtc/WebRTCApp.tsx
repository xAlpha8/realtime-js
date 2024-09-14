import React from "react";
import { RealtimeToast } from "@adaptai/realtime-react";
import { TRealtimeConfig } from "@adaptai/realtime-core";
import { TakeUserInput } from "./TakeUserInput";
import { RealtimeApp } from "./RealtimeApp";

export default function WebRTCApp() {
  const [config, setConfig] = React.useState<TRealtimeConfig | null>(null);

  function onSubmit(config: TRealtimeConfig) {
    setConfig(config);
  }

  function onDisconnect() {
    setConfig(null);
  }

  return (
    <>
      <RealtimeToast />
      {!config && <TakeUserInput onSubmit={onSubmit} />}
      {config && <RealtimeApp config={config} onDisconnect={onDisconnect} />}
    </>
  );
}
