import React from "react";
import {
  RealtimeForm,
  RealtimeFunctionURLInput,
  RealtimeAudioInput,
  RealtimeFormButton,
} from "@adaptai/realtime-react";
import {
  TRealtimeWebSocketConfig,
  ConsoleLogger,
} from "@adaptai/realtime-core";

import { Link } from "react-router-dom";
import { Button } from "../components/button";

export type TTakeUserInputProps = {
  onSubmit: (config: TRealtimeWebSocketConfig) => void;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit } = props;
  const [audioDeviceId, setAudioDeviceId] = React.useState("");
  const [functionURL, setFunctionURL] = React.useState(
    "http://localhost:8080/"
  );

  function handleFormSubmit() {
    try {
      const config = {
        functionURL,
        audio: {
          deviceId: audioDeviceId,
          echoCancellation: true,
        },
        logger: ConsoleLogger.getLogger(),
      } satisfies TRealtimeWebSocketConfig;

      onSubmit(config);
    } catch (error) {
      console.error("Unable to create config", error);
    }
  }

  return (
    <RealtimeForm>
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-lg">Websocket Example</span>
        <Link to="/">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
      <RealtimeFunctionURLInput
        onChange={(e) => setFunctionURL(e.currentTarget.value)}
        value={functionURL}
      />
      <RealtimeAudioInput
        value={audioDeviceId}
        onChange={setAudioDeviceId}
        description="Select the microphone you want to use. If you don't see your microphone, make sure it is plugged in."
      />
      <RealtimeFormButton onClick={handleFormSubmit}>Run</RealtimeFormButton>
    </RealtimeForm>
  );
}
