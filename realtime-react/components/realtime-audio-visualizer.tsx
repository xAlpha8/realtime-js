import { useEffect, useRef } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import { TMedia } from "../../realtime-core";

export type RealtimeAudioVisualizerProps = {
  tracks: TMedia[];
};

export function RealtimeAudioVisualizer(props: RealtimeAudioVisualizerProps) {
  const { tracks } = props;
  const audioVisualizerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);

  useEffect(() => {
    if (audioMotionRef.current == null) {
      audioMotionRef.current = new AudioMotionAnalyzer(
        audioVisualizerRef.current!,
        {
          mode: 10,
          channelLayout: "single",
          fsElement: audioVisualizerRef.current!,
          frequencyScale: "bark",
          colorMode: "gradient",
          gradientLeft: "rainbow",
          gradientRight: "rainbow",
          linearAmplitude: false,
          linearBoost: 1.8,
          lineWidth: 1.5,
          showPeaks: false,
          weightingFilter: "D",
          showScaleX: false,
          showScaleY: false,
        }
      );
    }

    tracks.forEach((media) => {
      if (
        media.track.kind === "audio" &&
        audioVisualizerRef.current &&
        media.stream.active === true
      ) {
        const audioStream =
          audioMotionRef.current!.audioCtx.createMediaStreamSource(
            media.stream
          );

        audioMotionRef.current!.connectInput(audioStream);
        audioMotionRef.current!.volume = 0;
      }
    });

    audioMotionRef.current!.start();

    return () => {
      audioMotionRef.current!.stop();
    };
  }, [tracks]);

  return <div className="rt-audio-visualizer" ref={audioVisualizerRef}></div>;
}
