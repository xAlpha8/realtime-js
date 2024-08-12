import { z } from "zod";
import { RealtimeConnection } from "../../realtime-core/RealtimConnection/RealtimeConnection";
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
      conn.mediaManager.remoteStreams.audio.forEach((media) => {
        console.log("registered visualizer track");
        if (audioVisualizerRef.current && media.track.kind === "audio") {
          console.log("Entered the if construct");
          const audioStream =
            audioMotionRef.current!.audioCtx.createMediaStreamSource(
              media.stream
            );

          audioMotionRef.current!.connectInput(audioStream);
          audioMotionRef.current!.volume = 0;
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
  }, [conn, audioVisualizerRef, props.width, props.height]);

  return (
    <div className="rt-audio-visualizer">
      <div id="audio-visualizer-container" ref={audioVisualizerRef}></div>
    </div>
  );
};

export { RtAudioVisualizer };
