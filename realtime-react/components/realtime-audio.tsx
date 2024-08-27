import { useEffect, useRef } from "react";
import { TMedia } from "../../realtime-core";

export type RealtimeAudioProps = {
  tracks: TMedia[];
};

export function RealtimeAudio(props: RealtimeAudioProps) {
  const { tracks } = props;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    tracks.forEach((media) => {
      if (
        audioRef.current &&
        media.track.kind === "audio" &&
        media.stream.active === true
      ) {
        audioRef.current.srcObject = media.stream;
      }
    });
  }, [tracks]);

  return <audio className="rt-audio" ref={audioRef} autoPlay={true}></audio>;
}
