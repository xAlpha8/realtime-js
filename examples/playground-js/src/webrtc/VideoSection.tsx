import {
  RealtimeAudio,
  RealtimeAudioVisualizer,
  RealtimeConnectionStatus,
  RealtimeVideo,
} from "@adaptai/realtime-react";
import { Track } from "@adaptai/realtime-core";
import React from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "../components/button";

export type TVideoSectionProps = {
  remoteTrack: Track | null;
  localTrack: Track | null;
  remoteAudioTrack: Track | null;
  localAudioTrack: Track | null;
  onCallEndClick: () => void;
};

export function VideoSection(props: TVideoSectionProps) {
  const {
    remoteTrack,
    localTrack,
    localAudioTrack,
    remoteAudioTrack,
    onCallEndClick,
  } = props;

  const [isLocalAudioTrackEnabled, setIsLocalAudioTrackEnabled] =
    React.useState(true);
  const [isRemoteAudioTrackEnabled, setIsRemoteAudioTrackEnabled] =
    React.useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);

  function toggleLocalAudioTrack() {
    if (!localAudioTrack) return;

    if (localAudioTrack.isMute()) {
      localAudioTrack.resume();
    } else {
      localAudioTrack.pause();
    }

    setIsLocalAudioTrackEnabled((prevState) => !prevState);
  }

  function toggleRemoteAudioTrack() {
    if (!remoteAudioTrack) return;

    if (remoteAudioTrack.isMute()) {
      remoteAudioTrack.resume();
    } else {
      remoteAudioTrack.pause();
    }

    setIsRemoteAudioTrackEnabled((prevState) => !prevState);
  }

  const resizeVideo = React.useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    // Available space is window.innerHeight - header height - padding & margin.
    const availableHeight = window.innerHeight - 105;
    container.style.height = `${availableHeight}px`;
  }, []);

  React.useEffect(() => {
    resizeVideo();

    window.addEventListener("resize", resizeVideo);

    return () => {
      window.removeEventListener("resize", resizeVideo);
    };
  });

  return (
    <div className="flex-1 relative border rounded" ref={containerRef}>
      <RealtimeVideo track={remoteTrack} />
      <div
        className={
          "uppercase absolute top-2 right-4 font-bold text-sm z-10 " +
          (remoteTrack?.stream.active ? "text-muted" : "text-gray-700")
        }
      >
        Remote
      </div>
      {!remoteTrack?.stream.active && (
        <div className="absolute top-2 left-4">
          <RealtimeConnectionStatus connectionStatus="connected" />
        </div>
      )}
      <div
        className={
          "absolute " +
          (remoteTrack?.stream.active ? "w-24 h-12 top-4 left-4" : "inset-3")
        }
      >
        <RealtimeAudioVisualizer track={remoteAudioTrack} />
      </div>

      <div className="h-52 w-96 absolute bottom-4 right-4 rounded border bg-white">
        <div className="h-full w-full relative group">
          <div
            className={
              "uppercase absolute top-1 left-2 font-bold text-sm z-10 " +
              (localTrack?.stream.active ? "text-muted" : "text-gray-700")
            }
          >
            Local
          </div>
          <RealtimeVideo track={localTrack} />
          <Button
            className="absolute right-4 top-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            variant="default"
            size="icon"
            onClick={toggleLocalAudioTrack}
          >
            {isLocalAudioTrackEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>
          <div
            className={
              "absolute  transition-opacity " +
              (localTrack?.stream.active
                ? "w-12 h-6 opacity-0 group-hover:opacity-100 bottom-2 left-4"
                : "inset-3")
            }
          >
            <RealtimeAudioVisualizer track={localAudioTrack} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-gray-200 rounded p-4 flex justify-center space-x-4">
        <Button
          className="rounded-full"
          variant="default"
          size="icon"
          onClick={toggleRemoteAudioTrack}
        >
          {isRemoteAudioTrackEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          className="rounded-full"
          variant="destructive"
          size="icon"
          onClick={onCallEndClick}
        >
          <PhoneOff className="h-4 w-4" />
        </Button>

        <RealtimeAudio track={remoteAudioTrack} />
      </div>
    </div>
  );
}
