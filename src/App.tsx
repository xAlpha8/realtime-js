import React from "react";
import { TakeUserInput } from "./TakeUserInput";
import { useRealtime } from "../realtime-react";
import { RealtimeApp } from "./RealtimeApp";

import "./App.css";

export default function App() {
  const [canMountRealtimeApp, setCanMountRealtimeApp] = React.useState(false);
  const { variables, ...realtime } = useRealtime();

  function onSubmit() {
    if (realtime.connectionStatus === "Disconnected") {
      realtime.reset();
    }
    setCanMountRealtimeApp(true);
  }

  function onDisconnect() {
    setCanMountRealtimeApp(false);
  }

  return (
    <>
      {!canMountRealtimeApp && (
        <TakeUserInput variables={variables} onSubmit={onSubmit} />
      )}
      {canMountRealtimeApp && (
        <RealtimeApp {...realtime} onDisconnect={onDisconnect} />
      )}
    </>
  );
}
