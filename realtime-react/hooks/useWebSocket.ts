import { useActor } from "@xstate/react";
import React from "react";
import {
  realtimeConnectionMachine,
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
  TRealtimeConfig,
  Track,
  WebSocketDataChannel,
} from "../../realtime-core";

export type TUseWebSocketReturn<T = unknown> = {
  ok?: boolean;
  error?: {
    msg: string;
  };
  data?: T;
};

export type TUseWebSocketOptions = {
  config: TRealtimeConfig;
};

export function useWebSocket(options: TUseWebSocketOptions) {
  const [actor, send] = useActor(realtimeConnectionMachine);
  const [remoteTracks, setRemoteTracks] = React.useState<Track[]>([]);
  const [dataChannel, setDataChannel] =
    React.useState<WebSocketDataChannel | null>(null);

  const { config } = options;

  const _eventListeners = React.useRef<
    Partial<
      Record<TRealtimeConnectionListenerType, TRealtimeConnectionListener[]>
    >
  >({});

  const _handleOnTrack = React.useCallback((event: unknown) => {
    throw new Error("Function not implemented.");
  }, []);

  const _registerEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ) => {
      if (_eventListeners.current[type]) {
        _eventListeners.current[type].push(listener);
      } else {
        _eventListeners.current[type] = [listener];
      }
    },
    []
  );

  const _unregisterEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ) => {
      if (!_eventListeners.current[type]) {
        return;
      }
      _eventListeners.current[type] = _eventListeners.current[type].filter(
        (fn) => fn !== listener
      );
    },
    []
  );

  const addEventListener = React.useCallback((): TUseWebSocketReturn => {
    throw new Error("Function not implemented.");
  }, []);

  const removeEventListener = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const connect = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const disconnect = React.useCallback((): TUseWebSocketReturn => {
    throw new Error("Function not implemented");
  }, []);

  const getLocalTracks = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const getLocalAudioTrack = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const getLocalVideoTrack = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const getRemoteTracks = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const getRemoteAudioTrack = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const getRemoteVideoTrack = React.useCallback(() => {
    throw new Error("Function not implemented.");
  }, []);

  const reset = React.useCallback((): TUseWebSocketReturn => {
    throw new Error("Function not implemented.");
  }, []);

  return {
    connectionStatus: actor.value,
    connect,
    disconnect,
    reset,
    dataChannel,
    addEventListener,
    removeEventListener,
    getLocalAudioTrack,
    getLocalVideoTrack,
    getLocalTracks,
    getRemoteAudioTrack,
    getRemoteVideoTrack,
    getRemoteTracks,
  };
}
