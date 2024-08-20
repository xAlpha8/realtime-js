import { useActor } from "@xstate/react";
import React from "react";
import {
  TMedia,
  isRTCTrackEvent,
  isValidConfig,
  realtimeConnectionMachine,
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
  TRealtimeConnectionPacketReceiveCallback,
} from "../../realtime-core";

import { useCreateConfig } from "./useCreateConfig";

export type TUseRealtimeFunctionReturn<T = unknown> = {
  ok?: boolean;
  error?: {
    msg: string;
  };
  data?: T;
};

export function useRealtime() {
  const [actor, send] = useActor(realtimeConnectionMachine);
  const [remoteStreams, setRemoteStreams] = React.useState<TMedia[]>([]);
  const { getConfig, ...variables } = useCreateConfig();

  const _eventListeners = React.useRef<
    Partial<
      Record<TRealtimeConnectionListenerType, TRealtimeConnectionListener[]>
    >
  >({});

  const _handleOnTrack = React.useCallback((event: unknown) => {
    if (!isRTCTrackEvent(event)) {
      return;
    }

    setRemoteStreams((prev) => [
      ...prev,
      { stream: event.streams[0], track: event.track },
    ]);
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

  const addEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ): TUseRealtimeFunctionReturn => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to add event listener. Did you call setup()?",
          },
        };
      }

      connection.addEventListener(type, listener);
      _registerEventListener(type, listener);

      return {
        ok: true,
      };
    },
    [_registerEventListener, actor.context.connection]
  );

  const removeEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ): TUseRealtimeFunctionReturn => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to remove event listener.",
          },
        };
      }

      connection.removeEventListener(type, listener);
      _unregisterEventListener(type, listener);

      return {
        ok: true,
      };
    },
    [_unregisterEventListener, actor.context.connection]
  );

  const addOnPacketReceiveListener = React.useCallback(
    (callback: TRealtimeConnectionPacketReceiveCallback, frequency = 1000) => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to add event listener. Did you call setup()?",
          },
        };
      }

      connection.addOnPacketReceiveListener(callback, frequency);
    },
    [actor.context.connection]
  );

  const removeOnPacketReceiveListener = React.useCallback(
    (callback: TRealtimeConnectionPacketReceiveCallback, frequency = 1000) => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to add event listener. Did you call setup()?",
          },
        };
      }

      connection.removeOnPacketReceiverListener(callback, frequency);
    },
    [actor.context.connection]
  );

  const removeAllOnPacketReceiveListeners = React.useCallback(() => {
    const connection = actor.context.connection;

    if (!connection) {
      return {
        error: {
          msg: "Failed to add event listener. Did you call setup()?",
        },
      };
    }

    connection.removeAllOnPacketReceiverListeners();
  }, [actor.context.connection]);

  const setup = React.useCallback((): TUseRealtimeFunctionReturn => {
    const config = getConfig();
    if (!config) {
      return {
        error: {
          msg: "Config is undefined. Make sure config is an object before calling setup()",
        },
      };
    }

    if (!isValidConfig(config)) {
      return {
        error: {
          msg: "Given config is not a valid config object.",
        },
      };
    }

    if (!actor.can({ type: "SETUP_CONNECTION", payload: { config } })) {
      return {
        error: {
          msg: `You cannot call 'setup()' if the connection state is: ${actor.value}, it can only be called if the connection state is Init`,
        },
      };
    }

    send({ type: "SETUP_CONNECTION", payload: { config } });

    return {
      ok: true,
    };
  }, [send, actor, getConfig]);

  const connect = React.useCallback(() => {
    if (!actor.can({ type: "CONNECT" })) {
      if (actor.value === "Init") {
        return {
          error: {
            msg: "Did you call setup()? Before we start connecting to the peer connection you need to call setup with proper config.",
          },
        };
      }

      if (actor.value !== "SetupCompleted") {
        return {
          error: {
            msg: `You cannot call connect() if the connection state is: ${actor.value}. It can only be called if the connection state is SetupCompleted.`,
          },
        };
      }
    }
    addEventListener("track", _handleOnTrack);

    send({ type: "CONNECT" });

    return {
      ok: true,
    };
  }, [actor, addEventListener, _handleOnTrack, send]);

  const disconnect = React.useCallback((): TUseRealtimeFunctionReturn => {
    if (!actor.can({ type: "DISCONNECT" })) {
      return {
        error: {
          msg: `You cannot call disconnect(), if the connection state is: ${actor.value}. It can only be called if the connection state is Connected`,
        },
      };
    }

    // Before disconnecting, we are removing all the registered event listeners.
    (
      Object.keys(_eventListeners.current) as TRealtimeConnectionListenerType[]
    ).forEach((type) => {
      const listeners = _eventListeners.current[type];
      if (!listeners) return;
      listeners.forEach((listener) => removeEventListener(type, listener));
    });
    _eventListeners.current = {};

    /**
     * Removing all packet received event listeners.
     */
    removeAllOnPacketReceiveListeners();

    send({ type: "DISCONNECT" });

    return {
      ok: true,
    };
  }, [actor, send, removeEventListener, removeAllOnPacketReceiveListeners]);

  const getLocalStream = React.useCallback(
    (
      type: "audio" | "video" | "screen"
    ): TUseRealtimeFunctionReturn<TMedia | null> => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Connection is not defined.",
          },
        };
      }

      try {
        const data = connection.mediaManager.localStreams[type][0];
        return {
          ok: true,
          data,
        };
      } catch (error) {
        console.error(error);
        return {
          error: {
            msg: "Unknown error occurred during retrieving local stream.",
          },
        };
      }
    },

    [actor]
  );

  const reset = React.useCallback((): TUseRealtimeFunctionReturn => {
    if (!actor.can({ type: "RESET" })) {
      return {
        error: {
          msg: `You cannot reset if the connection state is: ${actor.value}. It can be called if the connection state is Disconnected or Failed.`,
        },
      };
    }

    send({ type: "RESET" });

    return {
      ok: true,
    };
  }, [send, actor]);

  const sendMessage = React.useCallback(
    <T extends Record<string, unknown>>(obj: T): TUseRealtimeFunctionReturn => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "It seems connection is not defined.",
          },
        };
      }

      const response = connection.sendMessage(obj);

      if (response.ok) {
        return {
          ok: true,
        };
      }

      return {
        error: {
          msg: `Failed to send message. ${response.error}`,
        },
      };
    },
    [actor]
  );

  return {
    connectionStatus: actor.value,
    remoteStreams,
    setup,
    connect,
    disconnect,
    reset,
    addEventListener,
    removeEventListener,
    addOnPacketReceiveListener,
    removeOnPacketReceiveListener,
    getLocalStream,
    sendMessage,
    variables,
  };
}

export type TUseRealtimeReturn = ReturnType<typeof useRealtime>;
