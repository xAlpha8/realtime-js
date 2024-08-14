import { z } from "zod";
import { RealtimeConnection } from "../conn";
import { useEffect, useRef } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";

const RtAudioVisualizerPropsSchema = z.object({
  rtConnection: z.instanceof(RealtimeConnection),
  width: z.number(),
  height: z.number(),
});
type RtAudioVisualizerProps = z.infer<typeof RtAudioVisualizerPropsSchema>;

const RtAudioVisualizer = (props: RtAudioVisualizerProps) => {
  const conn = props.rtConnection;
  const audioVisualizerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);

  useEffect(() => {
    if (audioMotionRef.current == null) {
      audioMotionRef.current = new AudioMotionAnalyzer(
        audioVisualizerRef.current!,
        {
          width: props.width,
          height: props.height,
          gradient: "rainbow",
          showScaleY: false,
          showScaleX: false,
        }
      );
    }

    const registerTrack = () => {
      conn.tracks.forEach((track) => {
        console.log("registered visualizer track");
        if (audioVisualizerRef.current && track.kind === "audio") {
          console.log("Entered the if construct");
          const audioStream =
            audioMotionRef.current!.audioCtx.createMediaStreamSource(
              track.stream
            );

          audioMotionRef.current!.connectInput(audioStream);
          audioMotionRef.current!.volume = 0;
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
      audioMotionRef.current!.stop();
    };
  }, [conn, audioVisualizerRef]);

  return (
    <div className="rt-audio-visualizer">
      <div id="audio-visualizer-container" ref={audioVisualizerRef}></div>
    </div>
  );
};

export { RtAudioVisualizer };
