import React from "react";
import {
  TRealtimeConfig,
  createConfig,
  ConsoleLogger,
  RealtimeForm,
  RealtimeFunctionURLInput,
  RealtimeAudioInput,
  RealtimeVideoInput,
  RealtimeFormButton,
  RealtimeShareScreenInput,
} from "@adaptai/realtime-react";

export type TTakeUserInputProps = {
  onSubmit: (config: TRealtimeConfig) => void;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit } = props;
  const [shareScreen, setShareScreen] = React.useState("");
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const [videoDeviceId, setVideoDeviceId] = React.useState("");
  const [functionURL, setFunctionURL] = React.useState(
    "https://us0-dev.getadapt.ai/run/3e75182729bb655682854a6e6971238b"
  );

  function handleFormSubmit() {
    try {
      const config = createConfig({
        functionURL,
        audioDeviceId,
        videoDeviceId,
        screenConstraints: shareScreen === "yes" ? {} : undefined,
        logger: ConsoleLogger.getLogger(),
      });
      onSubmit(config);
    } catch (error) {
      console.error("Unable to create config", error);
    }
  }

  return (
    <RealtimeForm>
      <h3 className="mb-4 font-bold text-lg">WebRTC Example</h3>
      <RealtimeFunctionURLInput
        onChange={(e) => setFunctionURL(e.currentTarget.value)}
        value={functionURL}
      />
      <RealtimeAudioInput
        value={audioDeviceId}
        onChange={setAudioDeviceId}
        description="Select the microphone you want to use. If you don't see your microphone, make sure it is plugged in."
      />
      <RealtimeVideoInput
        value={videoDeviceId}
        onChange={setVideoDeviceId}
        description="Select the camera you want to use. If you don't see your camera, make sure it is plugged in."
      />
      <RealtimeShareScreenInput
        value={shareScreen}
        onChange={setShareScreen}
        description="If you select 'Yes', your screen will be shared."
      />
      <RealtimeFormButton onClick={handleFormSubmit}>Run</RealtimeFormButton>
    </RealtimeForm>
  );
}
