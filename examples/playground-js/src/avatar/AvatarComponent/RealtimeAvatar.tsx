
import React, { useState, useEffect, useRef } from "react";

import { DataChannel, isMessageEvent } from "@adaptai/realtime-core";
// @ts-ignore
import { TalkingHead } from "./talkinghead";

export type RealtimeAvatarProps = {
  dataChannel: DataChannel<unknown>;
};

export function RealtimeAvatar(props: RealtimeAvatarProps) {
  const { dataChannel } = props;
  const avatarRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<TalkingHead | null>(null)
  const [progressValue, setProgressValue] = useState<number>(0)

  function sendMessage(msg: string) {
    dataChannel.send({
      type: "message",
      data: msg 
    });
  }

  const fixChatContainerHeight = React.useCallback(() => {
    const chatContainer = document.getElementById("chat");
    if (chatContainer) {
      chatContainer.style.height = `${window.innerHeight - 100}px`;
    }
  }, []);

  useEffect(() => {
    if (avatarRef.current) {
      const head = new TalkingHead( avatarRef.current, {
          cameraZoomEnable: true,
          cameraPanEnable: true,
          cameraView: 'full',
          avatarMood: 'neutral',
          // Stats display that can be used when testing performance
          statsNode: document.body,
          statsStyle: "position: fixed; bottom: 0px; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10000;"
          });
      setAvatar(head)
    }
  }, [])

  useEffect(() => {
    if (avatar) {
      avatar.showAvatar(
        // {
        //   "url": "./models/brunette.glb",
        //   "body": "F",
        //   "avatarMood": "neutral",
        //   "fi": "Brunetti"
        // }
        {
          url: 'https://models.readyplayer.me/66e7f82164fc839991d89550.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
          body: 'F',
          avatarMood: 'neutral',
          ttsLang: "en-GB",
          ttsVoice: "en-GB-Standard-A",
          lipsyncLang: 'en'
        }
        , (ev: any) => {
          if ( ev.lengthComputable ) {
            let val = Math.min(100,Math.round(ev.loaded/ev.total * 100 ));
            setProgressValue(val)
            // console.log( "Loading " + val + "%")
          }
        }
      )
    }
  }, [avatar])

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
        // TODO HERE
        const message = JSON.parse(evt.data);
        if (avatar) {
        avatar.speakTextHttp(message)
        } else {
          console.log("avatar is null")
        }
      } catch (error) {
        console.error(error);
      }
    };

    dataChannel.addEventListener("message", onMessage);
    return () => {
      dataChannel.removeEventListener("message", onMessage);
    };
  }, [dataChannel, avatar]);

  return (
    <div
      id="chat"
      className="flex-1 h-full flex flex-col border rounded overflow-hidden"
    >
      <progress value={progressValue} />
      <div className="p-2 font-bold border-b">Avatar</div>
      <div
        ref={avatarRef}
        className="flex-1 flex flex-col overflow-auto space-y-2 px-2"
      >
      </div>
      <div className="overflow-hidden rounded" style={{ marginTop: 10 }}>
        <input
          className="px-2 py-4 w-full rounded bg-gray-100 hover:bg-gray-200 focus:bg-gray-50 focus:border-t"
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
