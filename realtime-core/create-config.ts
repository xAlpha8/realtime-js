import {
  TAudioCodec,
  TAudioConfig,
  TRealtimeConfig,
  TVideoCodec,
  TVideoConfig,
  TVideoTransform,
  TLogger,
} from "./shared/@types";

export type TCreateConfigInput = {
  functionURL: string;
  offerURL?: string;
  audioConstraints?: TAudioConfig;
  videoConstraints?: TVideoConfig;
  screenConstraints?: DisplayMediaStreamOptions;
  audioCodec?: TAudioCodec;
  videoCodec?: TVideoCodec;
  videoTransform?: TVideoTransform;
  dataChannelOptions?: RTCDataChannelInit;
  rtcConfig?: RTCConfiguration;
  logger?: TLogger;
};

export function createConfig(input: TCreateConfigInput): TRealtimeConfig {
  if (typeof input !== "object" || !input) {
    throw new Error("Input is not valid.");
  }
  const {
    functionURL,
    offerURL,
    audioCodec = "PCMU/8000",
    audioConstraints,
    videoConstraints,
    dataChannelOptions,
    rtcConfig,
    videoCodec,
    videoTransform,
    screenConstraints,
    logger,
  } = input;

  if (!functionURL && !offerURL) {
    throw new Error("Either `functionURL` or `offerURL` is required.");
  }

  const config: TRealtimeConfig = {
    functionURL,
    offerURL,
    videoTransform,
    dataChannelOptions,
    rtcConfig,
    audio: audioConstraints,
    video: videoConstraints,
    screen: screenConstraints,
    logger,
  };

  if (audioCodec || videoCodec) {
    config.codec = {
      audio: audioCodec,
      video: videoCodec,
    };
  }

  return config;
}
