import React from "react";
import "./App.css";
import { WebsocketApp } from "./websocket/WebsocketApp";

export default function App() {
  const [screenToShow, setScreenToShow] = React.useState<
    "selection" | "webrtc" | "websocket"
  >("selection");

  if (screenToShow === "webrtc") {
    return <div>Webrtc</div>;
  }

  if (screenToShow === "websocket") {
    return <WebsocketApp />;
  }

  return (
    <div className="container">
      <button onClick={() => setScreenToShow("webrtc")}>Webrtc Example</button>
      <button onClick={() => setScreenToShow("websocket")}>
        Websocket Example
      </button>
    </div>
  );
}
