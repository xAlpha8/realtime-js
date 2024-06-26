import { z } from "zod";
import { RealtimeConnection } from "../conn";
import { ChatMessage, ChatMessageSchema } from "../hooks/types";
import { useState, useEffect, useRef } from "react";

const RtChatPropsSchema = z.object({
  rtConnection: z.instanceof(RealtimeConnection),
});
type RtChatProps = z.infer<typeof RtChatPropsSchema>;

const RtChat = (props: RtChatProps) => {
  const conn = props.rtConnection;
  const chatRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onMessage = (evt: MessageEvent) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        JSON.parse(evt.data),
      ]);
    };

    const onStateChange = (state: RTCPeerConnectionState) => {
      console.log("ran onStateChange in rtChat");
      if (state === "connected") {
        conn.on("message", onMessage);
      }
    };

    if (conn.pc?.connectionState === "connected") {
      console.log("state is connected. attaching event handler");
      conn.on("message", onMessage);
    }
    conn.on("statechange", onStateChange);

    return () => {
      conn.off("statechange", onStateChange);
      conn.off("message", onMessage);
    };
  }, [conn, chatRef]);

  return (
    <div id="chat-container" className="chat-container">
      <div className="chat-container-header">Chat</div>
      <section
        ref={chatRef}
        className="chat-messages-container"
        id="chat-messages-container"
      >
        {messages.map((msg, index) => {
          return (
            <div key={index} className="chat-message">
              {msg["content"]}
            </div>
          );
        })}
      </section>
      <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
        <input
          className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
          placeholder="Type a message & hit Enter"
          ref={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.current?.value) {
              conn.send(
                JSON.stringify({
                  content: input.current?.value,
                  role: "user",
                })
              );
            }
          }}
        />
      </div>
    </div>
  );
};

export { RtChat as RtChat };
