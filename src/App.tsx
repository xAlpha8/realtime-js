import React from "react";

import { RealtimeApp } from "./RealtimeApp";

import "./App.css";
import { TRealtimeConfig } from "../realtime-core";
import { Toaster } from "react-hot-toast";

export default function App() {
  const [config, setConfig] = React.useState<TRealtimeConfig | null>(null);

  function onSubmit() {
    setConfig({
      functionURL:
        "https://us0-dev.getadapt.ai/run/691ebe09a99b4823b29e37bce47dd7ae",
      audio: true,
      video: true,
      dataChannelOptions: {
        ordered: true,
      },
    });
  }

  function onDisconnect() {
    setConfig(null);
  }

  return (
    <div>
      {!config && (
        <div className="h-screen w-screen flex justify-center items-center">
          <div className="flex flex-col flex-1 max-h-[700px] h-full max-w-2xl border rounded-[4px] border-[#333] p-4 space-y-4">
            <div className="flex flex-col justify-center items-center flex-1 border rounded-[4px] border-[#333] p-4">
              <span>Avatar</span>
              <br />
              <br />
              <br />
              <span>Not Connected</span>
            </div>

            <button onClick={onSubmit}>Connect</button>
          </div>
        </div>
      )}
      {config && <RealtimeApp config={config} onDisconnect={onDisconnect} />}
      <Toaster />
    </div>
  );
}
