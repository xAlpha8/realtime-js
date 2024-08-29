import { useState, useEffect, useRef } from "react";

import { isMessageEvent } from "../../realtime-core/utils";
import { DataChannel } from "../../realtime-core";

export type RealtimeChatProps = {
  dataChannel: DataChannel<unknown>;
};

export function RealtimeChat(props: RealtimeChatProps) {
  const { dataChannel } = props;
  const chatRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<
    { content?: string; text?: string }[]
  >([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onMessage = (evt: unknown) => {
      if (!isMessageEvent(evt)) {
        return;
      }

      if (typeof evt.data !== "string") {
        return;
      }

      try {
        const message = JSON.parse(evt.data);
        console.log(evt.data)
        setMessages((currentMessages) => [...currentMessages, message]);
      } catch (error) {
        console.error(error);
      }
    };

    dataChannel.addEventListener("message", onMessage);
    return () => {
      dataChannel.removeEventListener("message", onMessage);
    };
  }, [dataChannel]);

  return (
    <div className="rt-chat-container">
      <section ref={chatRef} className="rt-chat-messages-container">
        {messages.map((msg, index) => {
          const data = msg.content || msg.text;
          if (!data) return null;
          return (
            <div key={index} className="rt-chat-message">
              <b>Bot</b> {data}
            </div>
          );
        })}
      </section>
      <div className="rt-chat-input-container" style={{ marginTop: 10 }}>
        <input
          className="rt-chat-input"
          placeholder="Type a message & hit Enter"
          ref={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.current?.value) {
              dataChannel.send({
                content: input.current.value,
                role: "user",
              });

              input.current.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
