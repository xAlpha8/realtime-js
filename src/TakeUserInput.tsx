import { useAvailableMediaDevices } from "../realtime-react/hooks/useAvailableMediaDevices";
import { TUseCreateConfigVariables } from "../realtime-react";
import React from "react";
import { ConsoleLogger } from "../realtime-core";

export type TTakeUserInputProps = {
  onSubmit: () => void;
  variables: TUseCreateConfigVariables;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit, variables } = props;
  const { availableAudioDevices, availableVideoDevices } =
    useAvailableMediaDevices();
  const [canShareScreen, setCanShareScreen] = React.useState(false);
  const {
    audioDeviceId,
    setAudioDeviceId,
    videoDeviceId,
    setVideoDeviceId,
    functionURL,
    setFunctionURL,
    setScreenConstraints,
    setLogger,
  } = variables;

  function handleFormSubmit() {
    if (!functionURL) {
      console.error("Function URL is needed.");
      return;
    }

    if (canShareScreen) {
      setScreenConstraints({
        video: true,
      });
    } else {
      setScreenConstraints(undefined);
    }

    onSubmit();
  }

  React.useEffect(() => {
    // Chatbot
    setFunctionURL(
      "https://infra.getadapt.ai/run/68deae870da28f99a8562dcb962b9383"
    );

    // Cooking assistant
    // setFunctionURL(
    //   "https://infra.getadapt.ai/run/e4b93d828a74cd8e3065584dfd0d8d40"
    // );

    setLogger(new ConsoleLogger());
  }, [setFunctionURL, setLogger]);

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
          <div style={{ marginBottom: "4px" }}>
            <label>
              Screen Share&nbsp;
              <input
                type="checkbox"
                checked={canShareScreen}
                onChange={() => setCanShareScreen(!canShareScreen)}
              />
            </label>
          </div>
          <small>If you want to share your screen.</small>
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
