export type TVideoCodec = "default" | "VP8/90000" | "H264/90000";
export type TVideoTransform = "none" | "edges" | "cartoon" | "rotate";
export type TVideoConfig =
  | boolean
  | {
      /**
       * @default "default"
       */
      codec?: TVideoCodec;
      /**
       * @default "none"
       */
      transform?: TVideoTransform;
      /**
       * Video constraints
       */
      constraints?: MediaTrackConstraints;
    };

export type TAudioCodec =
  | "default"
  | "opus/48000/2"
  | "PCMU/8000"
  | "PCMA/8000";

export type TAudioConfig =
  | boolean
  | {
      /**
       * @default "default"
       */
      codec?: TAudioCodec;
      /**
       * Audio constraints
       */
      constraints?: MediaTrackConstraints;
    };

export type TLogger = {
  log: (label: string, ...all: unknown[]) => void;
  error: (label: string, ...all: unknown[]) => void;
  warn: (label: string, ...all: unknown[]) => void;
};

export type TRealtimeConfig = {
  /**
   * TODO: Add description
   */
  functionURL: string;
  /**
   * TODO: Add description
   */
  video?: TVideoConfig;
  /**
   * TODO: Add description
   */
  audio?: TAudioConfig;
  /**
   * TODO: Add description
   */
  screen?: DisplayMediaStreamOptions;
  /**
   * TODO: Add description
   */
  dataChannelOptions?: RTCDataChannelInit;
  /**
   * TODO: Add description
   */
  rtcConfig?: RTCConfiguration;
  /**
   * TODO: Add description
   */
  logger?: TLogger;
};

export type TMedia = {
  track: MediaStreamTrack;
  stream: MediaStream;
};

export type TResponse<E = unknown, T = unknown> = {
  ok?: boolean;
  error?: E;
  data?: T;
};
