import {
  TAudioCodec,
  TAudioConfig,
  TRealtimeConfig,
  TVideoCodec,
  TVideoConfig,
  TVideoTransform,
} from "./shared/@types";

export type TCreateConfigInput = {
  functionURL: string;
  audioConstraints?: TAudioConfig;
  videoConstraints?: TVideoConfig;
  screenConstraints?: DisplayMediaStreamOptions;
  audioCodec?: TAudioCodec;
  videoCodec?: TVideoCodec;
  videoTransform?: TVideoTransform;
  dataChannelOptions?: RTCDataChannelInit;
  rtcConfig?: RTCConfiguration;
};

export function createConfig(input: TCreateConfigInput): TRealtimeConfig {
  if (typeof input !== "object" || !input) {
    throw new Error("Input is not valid.");
  }
  const {
    functionURL,
    audioCodec = "PCMU/8000",
    audioConstraints,
    videoConstraints,
    dataChannelOptions,
    rtcConfig,
    videoCodec,
    videoTransform,
    screenConstraints,
  } = input;

  if (!functionURL) {
    throw new Error("functionURL is required.");
  }

  const config: TRealtimeConfig = {
    functionURL,
    videoTransform,
    dataChannelOptions,
    rtcConfig,
    audio: audioConstraints,
    video: videoConstraints,
    screen: screenConstraints,
  };

  if (audioCodec || videoCodec) {
    config.codec = {
      audio: audioCodec,
      video: videoCodec,
    };
  }

  return config;
}
