import React, { useState, useEffect } from "react";
import "./App.css";
import { useConfig, useRealtime } from "../lib";
import { Config } from "../lib";
import { RtVideo, RtAudio, RtChat } from "../lib";
import { RtAudioVisualizer } from "../lib/components/rtaudiovisualizer";
import { getAllUserMedia } from "../realtime-core/utils";

function RealtimeContainer({ config }: { config: Config }) {
  const { connection, isConnected, connectionStatus } = useRealtime(config);

  useEffect(() => {
    console.log("Connection state", connectionStatus, connection);
    if (connection && connectionStatus === "new") {
      console.log("connecting...");
      connection.connect();
    }
  }, [connection, config, connectionStatus]);

  useEffect(() => {
    if (isConnected && connection) {
      const receivers = connection.peerConnection.getReceivers();
      if (!receivers) return;

      receivers.forEach((receiver) => {
        if (receiver.track.kind === "audio") {
          setInterval(() => {
            const sources = receiver.getSynchronizationSources();
            sources.forEach((source) => {
              console.log(source.timestamp, source.source);
            });
          }, 10000);
          return;
        }
      });
    }
  }, [connection, isConnected]);

  return (
    <div>
      {isConnected && connection ? (
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
    functionUrl:
      "https://infra.getadapt.ai/run/34393a04fd88127fd52bb64c8a5941f9",
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

  const [audioOptions, setAudioOptions] = useState([] as MediaDeviceInfo[]);
  const [videoOptions, setVideoOptions] = useState([] as MediaDeviceInfo[]);

  const { setters, values, dump } = useConfig(configDefault);

  const { setAudioInput, setVideoInput, setOfferUrl, setFunctionUrl } = setters;
  const { audioInput, videoInput, offerUrl, functionUrl } = values;

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
    setIsRealtimeDisabled(false);
  };

  async function updateMedia() {
    try {
      const { audioInputDevices, videoInputDevices } = await getAllUserMedia();
      setAudioOptions(audioInputDevices);
      setVideoOptions(videoInputDevices);
    } catch (error) {
      console.log("Error", error);
    }
  }

  useEffect(() => {
    updateMedia();
  }, []);

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
                <option key={index} value={option.deviceId}>
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
                <option key={index} value={option.deviceId}>
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
