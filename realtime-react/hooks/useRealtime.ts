import { useActor } from "@xstate/react";
import { realtimeConnectionMachine } from "../machine/realtime-connection";
import React from "react";
import { TRealtimeConfig } from "../../realtime-core/shared/@types";
import { isValidConfig } from "../../realtime-core/utils";
import {
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
} from "../../realtime-core/RealtimeConnection/RealtimeConnection";

export type TUseRealtimeFunctionReturn = {
  ok?: boolean;
  error?: {
    msg: string;
  };
};

export function useRealtime() {
  const [actor, send] = useActor(realtimeConnectionMachine);

  const connect = React.useCallback(
    (config: TRealtimeConfig): TUseRealtimeFunctionReturn => {
      if (!config) {
        return {
          error: {
            msg: "Config is undefined. Make sure config is an object before calling connect()",
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

      if (!actor.can({ type: "SETUP_CONNECTION", payload: config })) {
        return {
          error: {
            msg: `You cannot call 'connect()' if the connection state is: ${actor.value}`,
          },
        };
      }

      send({ type: "SETUP_CONNECTION", payload: config });

      return {
        ok: true,
      };
    },
    [send, actor]
  );

  const retry = React.useCallback((): TUseRealtimeFunctionReturn => {
    if (!actor.can({ type: "RESET" })) {
      return {
        error: {
          msg: "",
        },
      };
    }

    send({ type: "RESET" });

    return {
      ok: true,
    };
  }, [send, actor]);

  const disconnect = React.useCallback((): TUseRealtimeFunctionReturn => {
    if (!actor.can({ type: "DISCONNECT" })) {
      return {
        error: {
          msg: `You cannot call disconnect(), if the connection state is: ${actor.value}`,
        },
      };
    }

    send({ type: "DISCONNECT" });

    return {
      ok: true,
    };
  }, [send, actor]);

  const addEventListener = React.useCallback(
    (
      type: TRealtimeConnectionListenerType,
      listener: TRealtimeConnectionListener
    ): TUseRealtimeFunctionReturn => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to add event listener. Did you call connect()?",
          },
        };
      }

      connection.addEventListener(type, listener);

      return {
        ok: true,
      };
    },
    [actor]
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

      return {
        ok: true,
      };
    },
    [actor]
  );

  return {
    connectionStatus: actor.value,
    connect,
    disconnect,
    retry,
    addEventListener,
    removeEventListener,
  };
}
