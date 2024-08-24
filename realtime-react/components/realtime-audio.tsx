import { useEffect, useRef } from "react";
import { TMedia } from "../../realtime-core";

export type RealtimeAudioProps = {
  remoteStreams: TMedia[];
};

export function RealtimeAudio(props: RealtimeAudioProps) {
  const { remoteStreams } = props;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    remoteStreams.forEach((media) => {
      if (
        audioRef.current &&
        media.track.kind === "audio" &&
        media.stream.active === true
      ) {
        audioRef.current.srcObject = media.stream;
      }
    });
  }, [remoteStreams]);

  return <audio className="rt-audio" ref={audioRef} autoPlay={true}></audio>;
}
