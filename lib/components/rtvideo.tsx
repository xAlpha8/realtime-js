import { z } from "zod";
import { RealtimeConnection } from "../conn";
import { useEffect, useRef } from "react";

const RtVideoPropsSchema = z.object({
  rtConnection: z.instanceof(RealtimeConnection),
});
type RtVideoProps = z.infer<typeof RtVideoPropsSchema>;

const RtVideo = (props: RtVideoProps) => {
  const conn = props.rtConnection;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const registerTrack = () => {
      conn.tracks.forEach((track) => {
        if (videoRef.current && track.kind === "video") {
          videoRef.current.srcObject = track.stream;
        }
      });
    };

    const onStateChange = (state: RTCPeerConnectionState) => {
      if (state === "connected") {
        registerTrack();
      }
    };

    if (conn.pc?.connectionState === "connected") {
      registerTrack();
    }
    conn.on("statechange", onStateChange);

    return () => {
      conn.off("statechange", onStateChange);
    };
  }, [conn, videoRef]);

  return (
    <div id="video-container">
      <div className="video-container-header">Video</div>
      <video
        ref={videoRef}
        id="video"
        autoPlay={true}
        playsInline={true}
      ></video>
    </div>
  );
};

export { RtVideo };
