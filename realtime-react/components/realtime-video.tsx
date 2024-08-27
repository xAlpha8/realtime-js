import { useEffect, useRef } from "react";
import { Track } from "../../realtime-core";

export type RealtimeVideoProps = {
  track: Track | null;
};

export function RealtimeVideo(props: RealtimeVideoProps) {
  const { track } = props;

  const videoRef = useRef<HTMLVideoElement>(null);

  function pauseVideo() {
    track?.pause();
  }

  function resumeVideo() {
    track?.resume();
  }

  useEffect(() => {
    if (track && videoRef.current) {
      videoRef.current.srcObject = track.stream;
    }
  }, [track]);

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
      <button onClick={resumeVideo}>Play Video</button>
      <button onClick={pauseVideo}>Pause Video</button>
    </div>
  );
}
