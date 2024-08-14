import { z } from "zod";
import { RealtimeConnection } from "../conn";
import { useEffect, useRef } from "react";

const RtAudioPropsSchema = z.object({
  rtConnection: z.instanceof(RealtimeConnection),
});
type RtAudioProps = z.infer<typeof RtAudioPropsSchema>;

const RtAudio = (props: RtAudioProps) => {
  const conn = props.rtConnection;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const registerTrack = () => {
      conn.tracks.forEach((track) => {
        if (audioRef.current && track.kind === "audio") {
          audioRef.current.srcObject = track.stream;
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
  }, [conn, audioRef]);

  return (
    <div id="audio-container">
      <div className="audio-container-label">Audio</div>
      <audio id="audio" ref={audioRef} autoPlay={true}></audio>
    </div>
  );
};

export { RtAudio };
