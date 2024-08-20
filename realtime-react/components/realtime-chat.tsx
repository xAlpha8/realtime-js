import { useState, useEffect, useRef } from "react";
import {
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
} from "../../realtime-core/RealtimeConnection/RealtimeConnection";
import { isMessageEvent } from "../../realtime-core/utils";

export type RealtimeChatProps = {
  addEventListeners: (
    type: TRealtimeConnectionListenerType,
    listener: TRealtimeConnectionListener
  ) => void;
  removeEventListeners: (
    type: TRealtimeConnectionListenerType,
    listener: TRealtimeConnectionListener
  ) => void;

  sendMessage: (obj: { content: string; role: string }) => void;
};

export function RealtimeChat(props: RealtimeChatProps) {
  const { addEventListeners, removeEventListeners, sendMessage } = props;
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
        setMessages((currentMessages) => [...currentMessages, message]);
      } catch (error) {
        console.error(error);
      }
    };

    addEventListeners("message", onMessage);
    return () => {
      removeEventListeners("message", onMessage);
    };
  }, [addEventListeners, removeEventListeners]);

  return (
    <div className="chat-container">
      <section ref={chatRef} className="chat-messages-container">
        {messages.map((msg, index) => {
          const data = msg.content || msg.text;
          if (!data) return null;
          return (
            <div key={index} className="chat-message">
              <b>Bot</b> {data}
            </div>
          );
        })}
      </section>
      <div style={{ marginTop: 10 }}>
        <input
          placeholder="Type a message & hit Enter"
          ref={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.current?.value) {
              sendMessage({
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
