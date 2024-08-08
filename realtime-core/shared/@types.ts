export type TVideoConfig = {
  /**
   * @default "default"
   */
  codec?: "default" | "VP8/90000" | "H264/90000";
  /**
   * @default "none"
   */
  transform?: "none" | "edges" | "cartoon" | "rotate";
  /**
   * Video constraints
   */
  constraints?: MediaTrackConstraints;
};

export type TAudioConfig = {
  /**
   * @default "default"
   */
  codec?: "default" | "opus/48000/2" | "PCMU/8000" | "PCMA/8000";
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
  video?: TVideoConfig | boolean;
  /**
   * TODO: Add description
   */
  audio?: TAudioConfig | boolean;
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

export type TRealtimeConnection = {
  readonly _config: TRealtimeConfig;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  tracks: RTCTrackEvent;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getRemoteVideoStreams: () => Promise<MediaStream[]>;
  getRemoteAudioStreams: () => Promise<MediaStream[]>;
};
