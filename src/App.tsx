import { useState, useEffect } from "react";
import "./App.css";
import { useConfig, useRealtime } from "../lib";
import { Config } from "../lib";
import { RtVideo, RtAudio, RtChat } from "../lib";
import { RtAudioVisualizer } from "../lib/components/rtaudiovisualizer";

function RealtimeContainer({ config }: { config: Config }) {
  const { connection, isConnected } = useRealtime(config);
  useEffect(() => {
    connection.connect();
  }, []);

  useEffect(() => {
    if (isConnected) {
      connection.onAudioPacketReceived((timestamp, prevTimestamp, source) => {
        console.log(timestamp, prevTimestamp, source);
      }, 10000);
    }
  }, [connection, isConnected]);

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
  const [config, setConfig] = useState<Config | null>(null);
  const configDefault: Config = {
    functionUrl: "",
    offerUrl: "http://0.0.0.0:8080/offer",
    isDataEnabled: true,
    dataParameters: { ordered: true },
    isVideoEnabled: false,
    videoInput: "",
    videoCodec: "default",
    videoResolution: "512x512",
    videoTransform: "none",
    isScreenShareEnabled: false,
    isAudioEnabled: true,
    audioInput: "",
    audioCodec: "PCMU/8000",
    useStun: false,
  };

  const { options, setters, values, dump } = useConfig(configDefault);
  const { audioOptions, videoOptions } = options;
  const { setAudioInput, setVideoInput, setOfferUrl, setFunctionUrl } = setters;
  const { audioInput, videoInput, offerUrl, functionUrl } = values;

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
            <h2>Offer URL:</h2>
            <input
              type="text"
              value={offerUrl}
              onChange={(e) => setOfferUrl(e.target.value)}
              placeholder="Enter Offer URL"
            />
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
