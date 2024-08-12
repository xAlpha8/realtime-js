import { Config } from "./types";
import { ConsoleLogger } from "../../realtime-core/Logger/ConsoleLogger";
import { ICE_STUN_SERVERS } from "../../realtime-core/constants";
import { useState, useEffect } from "react";

import { RealtimeConnection } from "../../realtime-core/RealtimConnection/RealtimeConnection";

function getANewRTCConnection(config: Config): RealtimeConnection {
  return new RealtimeConnection({
    functionURL: config.functionUrl || "",
    audio: {
      constraints: {
        deviceId: config.audioInput,
      },
      codec: "PCMU/8000",
    },
    video: {
      constraints: {
        deviceId: config.videoInput,
      },
    },
    screen: config.isScreenShareEnabled
      ? {
          video: true,
        }
      : undefined,
    logger: new ConsoleLogger(),
    dataChannelOptions: {
      ordered: true,
    },
    rtcConfig: {
      iceServers: ICE_STUN_SERVERS,
      // @ts-expect-error This is need. It will not throw any error.
      sdpSemantics: "unified-plan",
    },
  });
}

const useRealtime = (config: Config) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "new" | "failed" | "connected" | "disconnected" | "closed"
  >("new");

  const [connection, setConnection] = useState(() =>
    getANewRTCConnection(config)
  );

  async function reinit(config: Config) {
    connection.disconnect();
    setIsConnected(false);
    new Promise((resolve) => setTimeout(resolve, 3000));
    const newConnection = getANewRTCConnection(config);
    setConnection(newConnection);
    setConnectionStatus("new");
  }

  useEffect(() => {
    const onStateChange = () => {
      console.log(
        "connection state: ",
        connection?.peerConnection.connectionState
      );
      if (connection?.peerConnection.connectionState) {
        setConnectionStatus(connection.peerConnection.connectionState);
      }
    };

    console.log("Connection state", connection?.peerConnection.connectionState);
    if (connection) {
      connection.addEventListeners("connectionstatechange", onStateChange);
    }

    return () => {
      if (connection) {
        connection.removeEventListeners("connectionstatechange", onStateChange);
      }
    };
  }, [connection]);

  useEffect(() => {
    if (connectionStatus === "connected") {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [connectionStatus]);

  return {
    isConnected,
    connection,
    connectionStatus,
    reinit,
  };
};

export { useRealtime };
