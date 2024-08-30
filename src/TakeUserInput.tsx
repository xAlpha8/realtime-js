import { useAvailableMediaDevices } from "../realtime-react/hooks/useAvailableMediaDevices";
import React from "react";
import { ConsoleLogger, createConfig, TRealtimeConfig } from "../realtime-core";
import { AppHeader } from "./Header";

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
    "https://us0-dev.getadapt.ai/run/87e4ea07ef716206848e05d31f1a3054"
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
    <div className="container">
      <AppHeader status="Disconnected" />
      <div className="user-input-page">
        <form className="form space-y-4 w-full max-w-lg">
          <h2>Playground</h2>
          <div className="flex flex-col space-y-2">
            <h4>Function URL</h4>
            <input
              className="p-2"
              value={functionURL}
              onChange={(e) => setFunctionURL(e.target.value)}
              required
            />
            <small>Required</small>
          </div>
          <div className="flex flex-col space-y-2">
            <h4>Audio Options:</h4>
            <select
              className="p-2"
              value={audioDeviceId}
              onChange={(e) => setAudioDeviceId(e.target.value)}
            >
              <option className="p-1 bg-[#333]" value="" disabled>
                Select audio device
              </option>
              {availableAudioDevices.map((option, index) => (
                <option
                  className="p-1 bg-[#333] text-wrap"
                  key={index}
                  value={option.deviceId}
                >
                  {option.label.substring(0, 40)}
                  {option.label.length > 40 && "..."}
                </option>
              ))}
            </select>
            <small style={{ color: "#888" }}>
              If you don't want to use any audio device then leave this empty.
            </small>
          </div>

          {/* <div className="flex flex-col space-y-2">
            <h4>Video Options:</h4>
            <select
              className="p-2"
              value={videoDeviceId}
              onChange={(e) => setVideoDeviceId(e.target.value)}
            >
              <option value="" disabled className="p-1 bg-[#333]">
                Select video device
              </option>
              {availableVideoDevices.map((option, index) => (
                <option
                  className="p-1 bg-[#333]"
                  key={index}
                  value={option.deviceId}
                >
                  {option.label.substring(0, 40)}{" "}
                  {option.label.length > 40 && "..."}
                </option>
              ))}
            </select>
            <small style={{ color: "#888" }}>
              If you don't want to use any video device then leave this empty.
            </small>
          </div>

          <div className="flex flex-col space-y-2">
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
          </div> */}

          <div className="flex flex-col space-y-2">
            <button type="button" className="button" onClick={handleFormSubmit}>
              Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
