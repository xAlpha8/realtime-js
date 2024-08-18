import React from "react";
import {
  TAudioConfig,
  TRealtimeConfig,
  TVideoConfig,
} from "../realtime-core/shared/@types";
import { useAvailableMediaDevices } from "../realtime-react/hooks/useAvailableMediaDevices";

export type TTakeUserInputProps = {
  onSubmit: (data: TRealtimeConfig) => void;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit } = props;
  const { availableAudioDevices, availableVideoDevices } =
    useAvailableMediaDevices();
  const [audioDevice, setAudioDevice] = React.useState("");
  const [videoDevice, setVideoDevice] = React.useState("");
  const [functionURL, setFunctionURL] = React.useState(
    "https://infra.getadapt.ai/run/68deae870da28f99a8562dcb962b9383"
  );

  function handleFormSubmit() {
    const audioConfig: TAudioConfig = audioDevice
      ? { constraints: { deviceId: audioDevice }, codec: "PCMU/8000" }
      : false;
    const videoConfig: TVideoConfig = videoDevice
      ? { constraints: { deviceId: videoDevice } }
      : false;

    if (!functionURL) {
      console.error("Function URL is needed.");
      return;
    }

    onSubmit({
      audio: audioConfig,
      video: videoConfig,
      functionURL,
      dataChannelOptions: {
        ordered: true,
      },
    });
  }

  return (
    <div className="user-input-page">
      <form className="form">
        <h2>Realtime App</h2>
        <div className="stack">
          <h4>Function URL</h4>
          <input
            value={functionURL}
            onChange={(e) => setFunctionURL(e.target.value)}
            required
          />
          <small>Required</small>
        </div>
        <div className="stack">
          <h4>Audio Options:</h4>
          <select
            value={audioDevice}
            onChange={(e) => setAudioDevice(e.target.value)}
          >
            <option value="" disabled>
              Select audio device
            </option>
            {availableAudioDevices.map((option, index) => (
              <option key={index} value={option.deviceId}>
                {option.label}
              </option>
            ))}
          </select>
          <small>
            If you don't want to use any audio device then leave this empty.
          </small>
        </div>

        <div className="stack">
          <h4>Video Options:</h4>
          <select
            value={videoDevice}
            onChange={(e) => setVideoDevice(e.target.value)}
          >
            <option value="" disabled>
              Select video device
            </option>
            {availableVideoDevices.map((option, index) => (
              <option key={index} value={option.deviceId}>
                {option.label}
              </option>
            ))}
          </select>
          <small>
            If you don't want to use any video device then leave this empty.
          </small>
        </div>

        <div className="stack">
          <button type="button" onClick={handleFormSubmit}>
            Run
          </button>
        </div>
      </form>
    </div>
  );
}
