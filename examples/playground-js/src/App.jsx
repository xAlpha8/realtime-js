import { useState, useEffect } from "react";
import "./App.css";
import { useConfig, useRealtime } from "@adaptai/realtime-react";
import { RtVideo, RtAudio, RtChat } from "@adaptai/realtime-react";
import { RtAudioVisualizer } from "@adaptai/realtime-react";

function RealtimeContainer({ config }) {
  const { connection, isConnected } = useRealtime(config);
  useEffect(() => {
    connection.connect();
  }, []);
  return (
    <div>
      {isConnected ? (
        <>
          <RtVideo rtConnection={connection} />
          <RtAudio rtConnection={connection} />
          <RtAudioVisualizer
            rtConnection={connection}
            height={100}
            width={100}
          />
          <RtChat rtConnection={connection} />
        </>
      ) : (
        <>Connecting!</>
      )}
    </div>
  );
}

function App() {
  const [isRealtimeDisabled, setIsRealtimeDisabled] = useState(true);
  const [config, setConfig] = useState(null);
  const configDefault = {
    functionUrl: "",
    offerUrl: "",
    isDataEnabled: true,
    dataParameters: { ordered: true },
    isVideoEnabled: true,
    videoInput: "",
    videoCodec: "default",
    videoResolution: "256x256",
    videoTransform: "none",
    isScreenShareEnabled: false,
    isAudioEnabled: true,
    audioInput: "",
    audioCodec: "PCMU/8000",
    useStun: false,
  };

  const { options, setters, values, dump } = useConfig(configDefault);
  const { audioOptions, videoOptions } = options;
  const { setAudioInput, setVideoInput, setFunctionUrl } = setters;
  const { audioInput, videoInput, functionUrl } = values;

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
    setIsRealtimeDisabled(false);
  };

  return (
    <>
      {isRealtimeDisabled ? (
        <div>
          <div>
            <h2>Audio Options:</h2>
            <select
              value={audioInput}
              onChange={(e) => setAudioInput(e.target.value)}
            >
              {audioOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2>Video Options:</h2>
            <select
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
            >
              {videoOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2>Function URL:</h2>
            <input
              type="text"
              value={functionUrl}
              onChange={(e) => setFunctionUrl(e.target.value)}
              placeholder="Enter Function URL"
            />
          </div>
          <div>
            <button onClick={dumpConfigAndRun}>Run</button>
          </div>
        </div>
      ) : (
        <div>{config && <RealtimeContainer config={config} />}</div>
      )}
    </>
  );
}

export default App;
