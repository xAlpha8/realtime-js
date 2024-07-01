import { ConfigSchema, Config, DeviceOptions } from "./types";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const useConfig = (config: Partial<Config>) => {
  const [audioOptions, setAudioOptions] = useState<DeviceOptions[]>([]);
  const [videoOptions, setVideoOptions] = useState<DeviceOptions[]>([]);
  const videoCodecOptions = ["default", "VP8/90000", "H264/90000"];
  const videoResolutionOptions = [
    "default",
    "320x240",
    "512x512",
    "640x480",
    "960x540",
    "1280x720",
    "1920x1080",
    "3840x2160",
  ];
  const videoTransformOptions = ["none", "edges", "cartoon", "rotate"];
  const audioCodecOptions = [
    "default",
    "opus/48000/2",
    "PCMU/8000",
    "PCMA/8000",
  ];
  const dataParameterOptions = [
    { ordered: true },
    { ordered: false, maxRetransmits: 0 },
    { ordered: false, maxPacketLifetime: 500 },
  ];

  const [offerUrl, setOfferUrl] = useState(config.offerUrl || "");
  const [functionUrl, setFunctionUrl] = useState(config.functionUrl || "");
  const [isVideoEnabled, setIsVideoEnabled] = useState(
    config.isVideoEnabled || false
  );
  const [videoCodec, setVideoCodec] = useState(config.videoCodec || "default");
  const [videoTransform, setVideoTransform] = useState(
    config.videoTransform || "none"
  );
  const [videoResolution, setVideoResolution] = useState(
    config.videoResolution || "default"
  );
  const [videoInput, setVideoInput] = useState(config.videoInput || "");
  const [isAudioEnabled, setIsAudioEnabled] = useState(
    config.isAudioEnabled || false
  );
  const [audioCodec, setAudioCodec] = useState(config.audioCodec || "default");
  const [audioInput, setAudioInput] = useState(config.audioInput || "");
  const [isDataEnabled, setIsDataEnabled] = useState(
    config.isDataEnabled || false
  );
  const [dataParameters, setDataParameters] = useState(
    config.dataParameters || {}
  );
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(
    config.isScreenShareEnabled || false
  );

  useEffect(() => {
    const populateOptions = (
      devices: MediaDeviceInfo[],
      kind: string
    ): DeviceOptions[] => {
      var options = devices
        .filter((device) => device.kind === kind)
        .map((device, index) => ({
          value: device.deviceId,
          label: device.label || `Device #${index + 1}`,
        }));
      options.push({ value: "default", label: "default" });
      return options;
    };
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setAudioOptions(populateOptions(devices, "audioinput"));
        setVideoOptions(populateOptions(devices, "videoinput"));
      })
      .catch((e) => {
        alert(e);
      });
  }, []);

  useEffect(() => {
    if (audioOptions.length > 0) {
      setAudioInput(audioOptions[0].value);
    }
    if (videoOptions.length > 0) {
      setVideoInput(videoOptions[0].value);
    }
  }, [audioOptions, videoOptions]);

  const dump = (): Config => {
    const configDump = ConfigSchema.parse({
      functionUrl: functionUrl,
      offerUrl: offerUrl,
      isVideoEnabled: isVideoEnabled,
      videoCodec: videoCodec,
      videoTransform: videoTransform,
      videoResolution: videoResolution,
      videoInput: videoInput,
      isAudioEnabled: isAudioEnabled,
      audioCodec: audioCodec,
      audioInput: audioInput,
      isDataEnabled: isDataEnabled,
      isScreenShareEnabled: isScreenShareEnabled,
      useStun: false,
      dataParameters: dataParameters,
    });
    return configDump;
  };

  return {
    options: {
      audioOptions,
      videoOptions,
      videoCodecOptions,
      videoResolutionOptions,
      videoTransformOptions,
      audioCodecOptions,
      dataParameterOptions,
    },
    setters: {
      setFunctionUrl,
      setOfferUrl,
      setIsVideoEnabled,
      setVideoCodec,
      setVideoTransform,
      setVideoResolution,
      setVideoInput,
      setIsAudioEnabled,
      setAudioCodec,
      setAudioInput,
      setIsDataEnabled,
      setDataParameters,
      setIsScreenShareEnabled,
    },
    values: {
      functionUrl,
      offerUrl,
      isVideoEnabled,
      videoCodec,
      videoTransform,
      videoResolution,
      videoInput,
      isAudioEnabled,
      audioCodec,
      audioInput,
      isDataEnabled,
      dataParameters,
      isScreenShareEnabled,
    },
    dump,
  };
};

export { useConfig };
