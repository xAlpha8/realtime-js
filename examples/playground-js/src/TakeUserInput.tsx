import React from "react";
import {
  TRealtimeConfig,
  useAvailableMediaDevices,
  createConfig,
  ConsoleLogger,
} from "@adaptai/realtime";

export type TTakeUserInputProps = {
  onSubmit: (config: TRealtimeConfig) => void;
};

export function TakeUserInput(props: TTakeUserInputProps) {
  const { onSubmit } = props;
  const { availableAudioDevices, availableVideoDevices } =
    useAvailableMediaDevices();
  const [canShareScreen, setCanShareScreen] = React.useState(false);
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
        screenConstraints: canShareScreen ? {} : undefined,
        logger: ConsoleLogger.getLogger(),
      });
      onSubmit(config);
    } catch (error) {
      console.error("Unable to create config", error);
    }
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
