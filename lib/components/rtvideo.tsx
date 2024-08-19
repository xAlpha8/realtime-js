import { useEffect, useRef } from "react";
import { TMedia } from "../../realtime-core/shared/@types";

type RtVideoProps = {
  remoteStreams: TMedia[];
};

const RtVideo = (props: RtVideoProps) => {
  const { remoteStreams } = props;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    remoteStreams.forEach((media) => {
      if (!media) return;
      if (videoRef.current && media.track.kind === "video") {
        videoRef.current.srcObject = media.stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="video-container">
      <div className="video-wrapper">
        <video
          className="video"
          ref={videoRef}
          autoPlay={true}
          playsInline={true}
        ></video>
      </div>
    </div>
  );
};

export { RtVideo };
