import { useEffect, useRef } from "react";
import { TMedia } from "../../realtime-core/shared/@types";

type RtAudioProps = {
  remoteStreams: TMedia[];
};

const RtAudio = (props: RtAudioProps) => {
  const { remoteStreams } = props;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    remoteStreams.forEach((media) => {
      if (audioRef.current && media.track.kind === "audio") {
        audioRef.current.srcObject = media.stream;
      }
    });
  }, [remoteStreams]);

  return <audio ref={audioRef} autoPlay={true}></audio>;
};

export { RtAudio };
