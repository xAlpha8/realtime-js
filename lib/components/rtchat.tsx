import { useState, useEffect, useRef } from "react";
import {
  TRealtimeConnectionListener,
  TRealtimeConnectionListenerType,
} from "../../realtime-core/RealtimeConnection/RealtimeConnection";
import { isMessageEvent } from "../../realtime-core/utils";

type RtChatProps = {
  addEventListeners: (
    type: TRealtimeConnectionListenerType,
    listener: TRealtimeConnectionListener
  ) => void;
  removeEventListeners: (
    type: TRealtimeConnectionListenerType,
    listener: TRealtimeConnectionListener
  ) => void;
};

const RtChat = (props: RtChatProps) => {
  const { addEventListeners, removeEventListeners } = props;
  const chatRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<
    { content?: string; text?: string }[]
  >([]);
  // const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onMessage = (evt: unknown) => {
      if (!isMessageEvent(evt)) {
        return;
      }
      setMessages((currentMessages) => [
        ...currentMessages,
        JSON.parse(evt.data),
      ]);
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
      {/* <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
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
      </div> */}
    </div>
  );
};

export { RtChat as RtChat };
