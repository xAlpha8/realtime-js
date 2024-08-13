import React, { useEffect } from "react";

export function Video() {
  const ref = React.useRef<HTMLVideoElement>(null);

  const init = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        height: { ideal: 1080 },
        width: { ideal: 1920 },
      },
    });
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="video-container">
      <video className="video" ref={ref} playsInline autoPlay />
    </div>
  );
}
