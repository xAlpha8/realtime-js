import { useEffect, useRef } from "react";
import { TMedia } from "../../realtime-core/shared/@types";

export type RealtimeVideoProps = {
  remoteStreams: TMedia[];
};

export function RealtimeVideo(props: RealtimeVideoProps) {
  const { remoteStreams } = props;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    remoteStreams.forEach((media) => {
      if (!media) return;
      if (
        videoRef.current &&
        media.track.kind === "video" &&
        media.stream.active === true
      ) {
        videoRef.current.srcObject = media.stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="rt-video-container">
      <div className="rt-video-wrapper">
        <video
          className="rt-video"
          ref={videoRef}
          autoPlay={true}
          playsInline={true}
        ></video>
      </div>
    </div>
  );
}
