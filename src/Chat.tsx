import React, { useState, useEffect, useRef } from "react";

import { isMessageEvent } from "../realtime-core/utils";
import { DataChannel } from "../realtime-core";
import toast from "react-hot-toast";

export type ChatProps = {
  dataChannel: DataChannel<unknown>;
};

export function Chat(props: ChatProps) {
  const { dataChannel } = props;
  const chatRef = useRef<HTMLAudioElement>(null);
  const [messages, setMessages] = useState<
    { content?: string; text?: string; type: "user" | "bot" }[]
  >([]);
  const input = useRef<HTMLInputElement>(null);

  function updateMessage(message: {
    content?: string;
    text?: string;
    type: "user" | "bot";
  }) {
    setMessages((currentMessages) => [...currentMessages, message]);

    setTimeout(() => {
      chatRef.current?.scroll({
        top: chatRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }, 300);
  }

  function sendMessage(msg: string) {
    updateMessage({ content: msg, type: "user" });

    dataChannel.send({
      content: msg,
      role: "user",
    });
  }

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

        if (message.widget) {
          // This is a widget.
          toast(<div dangerouslySetInnerHTML={{ __html: message.widget }} />);
        }

        updateMessage({ ...message, type: "bot" });
      } catch (error) {
        console.error(error);
      }
    };

    dataChannel.addEventListener("message", onMessage);
    return () => {
      dataChannel.removeEventListener("message", onMessage);
    };
  }, [dataChannel]);

  console.log("Messages", messages);

  return (
    <div id="chat" className="flex space-x-4">
      <input
        className="px-2 py-4 w-full rounded-[16px]"
        placeholder="Type a message & hit Enter"
        ref={input}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input.current?.value) {
            sendMessage(input.current.value);
            input.current.value = "";
          }
        }}
      />
      <button
        onClick={() => {
          if (input.current?.value) {
            sendMessage(input.current.value);
            input.current.value = "";
          }
        }}
      >
        Send
      </button>
    </div>
  );
}
