import { forwardRef } from "react";

const devAudio = forwardRef<HTMLAudioElement, {}>(function RtAudio(props, ref) {
  return (
    <div
      className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col"
    >
      <div id="audio-container" className="h-full flex items-center justify-center">
        <div className="nes-text is-disabled media-container-label">Audio</div>
        <audio id="audio" ref={ref} autoPlay={true}></audio>
        <div id="audio-visualizer-container" className="h-full"></div>
      </div>
    </div>
  );
});

const devChat = forwardRef<HTMLDivElement>(function (props, ref) {
    return (
    <div
      className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col"
    >
      <section id="chat-container" className="nes-container p-0 border-0 overflow-y-scroll h-full flex justify-center items-center">
        <div className="nes-text is-disabled media-container-label">Chat</div>
        <section
          ref={ref}
          className="message-list text-xs"
          id="chat-messages"
        ></section>
      </section>
    </div>
    )
})


const devVideo = forwardRef<HTMLVideoElement, {}>(function RtVideo(props, ref) {
  return (
    <div
      className="col-span-4 md:col-span-3 row-span-2 border border-solid  border-black rounded-md flex justify-center items-center overflow-hidden"
      id="video-container"
    >
      <div className="nes-text is-disabled media-container-label">Video</div>
      <video
        ref={ref}
        id="video"
        autoPlay={true}
        playsInline={true}
      ></video>
    </div>
  );
});

export {
    devAudio,
    devVideo,
    devChat
}