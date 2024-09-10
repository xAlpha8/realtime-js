import React from "react";
import { TRealtimeWebSocketConfig } from "@adaptai/realtime-react";

import { TakeUserInput } from "./TakeUserInput";
import { Websocket } from "./Websocket";

export function WebsocketApp() {
  const [config, setConfig] = React.useState<TRealtimeWebSocketConfig | null>(
    null
  );

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
