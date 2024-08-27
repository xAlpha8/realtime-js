import { useEffect, useRef } from "react";
import { Track } from "../../realtime-core";

export type RealtimeAudioProps = {
  track: Track | null;
};

export function RealtimeAudio(props: RealtimeAudioProps) {
  const { track } = props;
  const audioRef = useRef<HTMLAudioElement>(null);

  function pauseAudio() {
    track?.pause();
  }

  function resumeAudio() {
    track?.resume();
  }

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.srcObject = track.stream;
    }
  }, [track]);

  return (
    <div>
      <audio className="rt-audio" ref={audioRef} autoPlay={true}></audio>
      <button onClick={pauseAudio}>Mute Audio</button>
      <button onClick={resumeAudio}>Resume Audio</button>
    </div>
  );
}
