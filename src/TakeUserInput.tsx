import { useAvailableMediaDevices } from "../realtime-react/hooks/useAvailableMediaDevices";
import { TUseCreateConfigVariables } from "../realtime-react";
import React from "react";

export type TTakeUserInputProps = {
  onSubmit: () => void;
  variables: TUseCreateConfigVariables;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit, variables } = props;
  const { availableAudioDevices, availableVideoDevices } =
    useAvailableMediaDevices();
  const {
    audioDeviceId,
    setAudioDeviceId,
    videoDeviceId,
    setVideoDeviceId,
    functionURL,
    setFunctionURL,
  } = variables;

  function handleFormSubmit() {
    if (!functionURL) {
      console.error("Function URL is needed.");
      return;
    }

    onSubmit();
  }

  React.useEffect(() => {
    // For testing setting default function URL on Mount.
    setFunctionURL(
      "https://infra.getadapt.ai/run/68deae870da28f99a8562dcb962b9383"
    );
  }, [setFunctionURL]);

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
            value={audioDeviceId}
            onChange={(e) => setAudioDeviceId(e.target.value)}
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
            value={videoDeviceId}
            onChange={(e) => setVideoDeviceId(e.target.value)}
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
