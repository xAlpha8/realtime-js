import { z } from "zod";
import { RealtimeConnection } from "../../realtime-core/RealtimConnection/RealtimeConnection";
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
      conn.mediaManager.remoteStreams.audio.forEach((media) => {
        if (audioRef.current && media.track.kind === "audio") {
          audioRef.current.srcObject = media.stream;
        }
      });
    };

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
  }, [conn, audioRef]);

  return (
    <div id="audio-container">
      <div className="audio-container-label">Audio</div>
      <audio id="audio" ref={audioRef} autoPlay={true}></audio>
    </div>
  );
};

export { RtAudio };
