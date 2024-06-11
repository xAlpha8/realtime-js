import { WebRTCConnectionManager } from "../conn";
import { ConfigSchema, Config, DeviceOptions } from "./types";
// import AudioMotionAnalyzer from "audiomotion-analyzer";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const useRealtime = (config: Config) => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const connection = useMemo(() => {
    WebRTCConnectionManager.setConfig(config)
    return WebRTCConnectionManager.get()
  }, [config])

  useEffect(() => {
    const onStateChange = (state: RTCPeerConnectionState) => {
      if (state === "connected") {
        setIsConnected(true);
      }
    }
    if (connection.pc?.connectionState === "connected") {
      setIsConnected(true);
    }
    if (connection.pc) {
      connection.on("statechange", onStateChange);
    }

    return () => {
      if (connection.pc) {
        connection.off("statechange", onStateChange)
      }
    }
  }, [config, connection.pc]);
  
  return {
    isConnected,
    connection
  }
}

export { useRealtime }