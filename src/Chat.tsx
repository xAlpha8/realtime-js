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

  const fixChatContainerHeight = React.useCallback(() => {
    const chatContainer = document.getElementById("chat");
    if (chatContainer) {
      chatContainer.style.height = `${window.innerHeight - 160}px`;
    }
  }, []);

  useEffect(() => {
    fixChatContainerHeight();
    window.addEventListener("resize", fixChatContainerHeight);

    return () => {
      window.removeEventListener("resize", fixChatContainerHeight);
    };
  }, [fixChatContainerHeight]);

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

  return (
    <div
      id="chat"
      className="flex-1 h-full flex flex-col border border-gray-500 rounded-[16px] overflow-hidden"
    >
      <div className="p-2 bg-[#333]">Chat</div>
      <section
        ref={chatRef}
        className="flex-1 flex flex-col overflow-auto space-y-2 px-2"
      >
        {messages.map((msg, index) => {
          const data = msg.content || msg.text;
          if (!data) return null;

          if (msg.type === "user") {
            return (
              <div
                key={index}
                className="ml-auto text-right inline-flex flex-col space-y-1 max-w-[200px]"
              >
                <span>User</span>
                <span className=" py-2 px-4 rounded-[8px] bg-[#333]">
                  {data}
                </span>
              </div>
            );
          }

          return (
            <div
              key={index}
              className="mr-auto inline-flex flex-col space-y-1 max-w-[200px]"
            >
              <span>Avatar</span>
              <span className=" py-2 px-4 rounded-[8px] bg-[#007bff]">
                {data}
              </span>
            </div>
          );
        })}
      </section>
      <div className="overflow-hidden rounded-[16px]" style={{ marginTop: 10 }}>
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
      </div>
    </div>
  );
}
