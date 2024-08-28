import React from "react";
import {
  RealtimeWebSocketConnection,
  TRealtimeWebSocketConfig,
} from "../../realtime-core";

export type TUseWebSocketOptions = {
  config: TRealtimeWebSocketConfig;
};

export function useWebSocket(options: TUseWebSocketOptions) {
  const { config } = options;
  const [connection, setConnection] =
    React.useState<RealtimeWebSocketConnection>(
      new RealtimeWebSocketConnection(config)
    );

  const connect = React.useCallback(async () => {
    const response = await connection.connect();
    if (!response.ok) {
      // This will release media, if it is setup.
      await connection.disconnect();
      return console.error("Failed to connect", response);
    }
  }, [connection]);

  const disconnect = React.useCallback(async () => {
    if (connection) {
      await connection.disconnect();
    }
  }, [connection]);

  const updateConnection = React.useCallback(
    async (config: TRealtimeWebSocketConfig) => {
      if (connection) {
        await connection.disconnect();
      }
      const newConnection = new RealtimeWebSocketConnection(config);
      setConnection(newConnection);
      await newConnection.connect();
    },
    [connection]
  );

  return {
    connect,
    disconnect,
    updateConnection,
  };
}
