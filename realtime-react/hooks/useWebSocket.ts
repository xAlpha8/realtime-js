import { IMediaRecorderEventMap } from "extendable-media-recorder";
import React from "react";
import {
  RealtimeWebSocketConnection,
  Track,
  TRealtimeWebSocketConfig,
} from "../../realtime-core";
import { blobToBase64 } from "./utils";

export type TUseWebSocketOptions = {
  config: TRealtimeWebSocketConfig;
};

export type TWebSocketConnectionStatus =
  | "new"
  | "connecting"
  | "connected"
  | "failed"
  | "disconnected";

export function useWebSocket(options: TUseWebSocketOptions) {
  const { config } = options;
  const [connection, setConnection] =
    React.useState<RealtimeWebSocketConnection | null>(null);
  const [connectionStatus, setConnectionStatus] =
    React.useState<TWebSocketConnectionStatus>("new");
  const [remoteTrack, setRemoteTrack] = React.useState<Track | null>(null);

  const onRecordingAvailable = React.useCallback(
    (event: IMediaRecorderEventMap["dataavailable"]) => {
      blobToBase64(event.data).then((base64) => {
        if (
          !base64 ||
          !connection ||
          !connection.dataChannel ||
          !connection.isReady()
        ) {
          return;
        }

        if (connection.mediaManager.track?.isMute()) {
          return;
        }

        connection.dataChannel?.send({ type: "audio", data: base64 });
      });
    },
    [connection]
  );

  const connect = React.useCallback(async () => {
    setConnectionStatus("connecting");
    const ws = new RealtimeWebSocketConnection(config);
    const response = await ws.connect();
    if (!response.ok) {
      // This will release media, if it is setup.
      await ws.disconnect();
      setConnectionStatus("failed");
      return console.error("Failed to connect", response);
    }
    setConnection(ws);
    setConnectionStatus("connected");
  }, [config]);

  const disconnect = React.useCallback(async () => {
    if (!connection) {
      return;
    }

    await connection.disconnect();
    connection.mediaManager.recorder?.removeEventListener(
      "dataavailable",
      onRecordingAvailable
    );

    setConnectionStatus("disconnected");
  }, [connection, onRecordingAvailable]);

  const getLocalAudioTrack = React.useCallback(() => {
    if (!connection) return null;

    return connection.mediaManager.track;
  }, [connection]);

  const getRemoteAudioTrack = React.useCallback(() => {
    if (remoteTrack) return remoteTrack;
    if (!connection) return null;

    const response = connection.mediaManager.getRemoteAudioTrack();

    if (!response.ok || !response.data) return null;

    setRemoteTrack(response.data);
    return response.data;
  }, [connection, remoteTrack]);

  React.useEffect(() => {
    if (connection) {
      connection.mediaManager.recorder?.addEventListener(
        "dataavailable",
        onRecordingAvailable
      );
    }

    return () => {
      if (connection) {
        connection.mediaManager.recorder?.removeEventListener(
          "dataavailable",
          onRecordingAvailable
        );
      }
    };
  }, [connection, onRecordingAvailable]);

  return {
    connect,
    disconnect,
    connectionStatus,
    dataChannel: connection?.dataChannel,
    getLocalAudioTrack,
    getRemoteAudioTrack,
    connection,
  };
}
