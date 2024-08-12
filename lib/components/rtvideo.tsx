import { z } from "zod";
import { RealtimeConnection } from "../../realtime-core/RealtimConnection/RealtimeConnection";
import { useCallback, useEffect, useRef } from "react";

const RtVideoPropsSchema = z.object({
  rtConnection: z.instanceof(RealtimeConnection),
});
type RtVideoProps = z.infer<typeof RtVideoPropsSchema>;

const RtVideo = (props: RtVideoProps) => {
  const conn = props.rtConnection;
  const videoRef = useRef<HTMLVideoElement>(null);

  const updateVideo = useCallback(async () => {
    conn.mediaManager.localStreams.video.forEach((media) => {
      if (media.track.kind === "video") {
        if (videoRef.current) {
          videoRef.current.srcObject = media.stream;
        }
      }
    });
  }, [conn]);

  useEffect(() => {
    const registerTrack = () => {
      updateVideo();
    };

    registerTrack();
    const onStateChange = () => {
      if (conn.peerConnection.connectionState === "connected") {
        registerTrack();
      }
    };

    if (conn.peerConnection.connectionState === "connected") {
      registerTrack();
    }

    conn.addEventListener("connectionstatechange", onStateChange);

    return () => {
      conn.removeEventListener("connectionstatechange", onStateChange);
    };
  }, []);

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
