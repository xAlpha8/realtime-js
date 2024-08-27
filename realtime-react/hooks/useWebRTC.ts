import { useActor } from "@xstate/react";
import React from "react";
import {
  TMedia,
  isRTCTrackEvent,
  realtimeConnectionMachine,
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
  TRealtimeConnectionPacketReceiveCallback,
  TRealtimeConfig,
} from "../../realtime-core";

export type TUseWebRTCReturn<T = unknown> = {
  ok?: boolean;
  error?: {
    msg: string;
  };
  data?: T;
};

export type TUseWebRTCOptions = {
  config: TRealtimeConfig;
};

export class DataChannel {
  private _rtcDataChannel: RTCDataChannel;

  constructor(rtcDataChannel: RTCDataChannel) {
    this._rtcDataChannel = rtcDataChannel;
  }

  on_recv(callback: (ev: MessageEvent) => void) {
    this._rtcDataChannel.onmessage = callback;
  }

  send(obj: object) {
    try {
      this._rtcDataChannel.send(JSON.stringify(obj));
    } catch (error) {
      console.error(error);
    }
  }
}

export function useWebRTC(options: TUseWebRTCOptions) {
  const [actor, send] = useActor(realtimeConnectionMachine);
  const [remoteStreams, setRemoteStreams] = React.useState<TMedia[]>([]);
  const [dataChannel, setDataChannel] = React.useState<DataChannel | null>(
    null
  );

  const { config } = options;

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
    ): TUseWebRTCReturn => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Failed to add event listener.",
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
    ): TUseWebRTCReturn => {
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
            msg: "Failed to add event listener.",
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
            msg: "Failed to add event listener.",
          },
        };
      }
      connection.dataChannel;

      connection.removeOnPacketReceiverListener(callback, frequency);
    },
    [actor.context.connection]
  );

  const removeAllOnPacketReceiveListeners = React.useCallback(() => {
    const connection = actor.context.connection;

    if (!connection) {
      return {
        error: {
          msg: "Failed to add event listener.",
        },
      };
    }

    connection.removeAllOnPacketReceiverListeners();
  }, [actor.context.connection]);

  const connect = React.useCallback(() => {
    if (!actor.can({ type: "CONNECT" })) {
      return {
        error: {
          msg: `You cannot call connect() if the connection state is: ${actor.value}. It can only be called if the connection state is SetupCompleted.`,
        },
      };
    }

    addEventListener("track", _handleOnTrack);

    send({ type: "CONNECT" });

    return {
      ok: true,
    };
  }, [actor, addEventListener, _handleOnTrack, send]);

  const disconnect = React.useCallback((): TUseWebRTCReturn => {
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
    setRemoteStreams([]);

    /**
     * Removing all packet received event listeners.
     */
    removeAllOnPacketReceiveListeners();

    send({ type: "DISCONNECT" });

    return {
      ok: true,
    };
  }, [actor, send, removeEventListener, removeAllOnPacketReceiveListeners]);

  const getLocalTracks = React.useCallback(
    (type: "audio" | "video" | "screen"): TUseWebRTCReturn<TMedia[] | null> => {
      const connection = actor.context.connection;

      if (!connection) {
        return {
          error: {
            msg: "Connection is not defined.",
          },
        };
      }

      try {
        const data = connection.mediaManager.localStreams[type];
        return {
          ok: true,
          data,
        };
      } catch (error) {
        console.error(error);
        return {
          error: {
            msg: `Unknown error occurred during retrieving local {${type} stream.`,
          },
        };
      }
    },

    [actor]
  );

  const getLocalAudioTracks = React.useCallback(() => {
    const res = getLocalTracks("audio");

    if (res.data) {
      return res.data;
    }

    return [];
  }, [getLocalTracks]);

  const getLocalVideoTracks = React.useCallback(() => {
    const res = getLocalTracks("video");

    if (res.data) {
      return res.data;
    }

    return [];
  }, [getLocalTracks]);

  const getRemoteTracks = React.useCallback(
    (type: "audio" | "video"): TUseWebRTCReturn<TMedia[] | null> => {
      try {
        const data = remoteStreams.filter(
          (media) => media.track.kind === type && media.stream.active === true
        );

        return {
          ok: true,
          data,
        };
      } catch (error) {
        console.error(error);
        return {
          error: {
            msg: "Unknown error occurred during retrieving remote stream.",
          },
        };
      }
    },

    [remoteStreams]
  );

  const getRemoteAudioTracks = React.useCallback(() => {
    const res = getRemoteTracks("audio");

    if (res.data) {
      return res.data;
    }

    return [];
  }, [getRemoteTracks]);

  const getRemoteVideoTracks = React.useCallback(() => {
    const res = getRemoteTracks("video");

    if (res.data) {
      return res.data;
    }

    return [];
  }, [getRemoteTracks]);

  const reset = React.useCallback((): TUseWebRTCReturn => {
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

  React.useEffect(() => {
    if (actor.can({ type: "SETUP_CONNECTION", payload: { config } })) {
      send({ type: "SETUP_CONNECTION", payload: { config } });
    }
  }, [actor, send, config]);

  React.useEffect(() => {
    const connection = actor.context.connection;

    if (connection && connection.dataChannel && actor.value === "Connected") {
      setDataChannel(new DataChannel(connection.dataChannel));
    }

    return () => {
      setDataChannel(null);
    };
  }, [actor]);

  return {
    connectionStatus: actor.value,
    dataChannel,
    connect,
    disconnect,
    reset,
    addEventListener,
    removeEventListener,
    addOnPacketReceiveListener,
    removeOnPacketReceiveListener,
    getLocalAudioTracks,
    getLocalVideoTracks,
    getLocalTracks,
    getRemoteAudioTracks,
    getRemoteVideoTracks,
    getRemoteTracks,
  };
}
