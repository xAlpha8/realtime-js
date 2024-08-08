import { TRealtimeConfig } from "../shared/@types";

export class RealTimeConnection {
  readonly _config: TRealtimeConfig;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  tracks: RTCTrackEvent;

  constructor(config: TRealtimeConfig) {
    this._config = config;
  }

  /**
   * Establishes the WebRTC connection. After establishing connection
   * it will also update tracks.
   *
   * @returns {} - Resolves when the connection is established.
   * @throws Will throw an error if the connection cannot be established.
   */
  async connect(): Promise<void> {}

  /**
   * Disconnects the WebRTC connection.
   *
   * @returns {Promise<void>} - Resolves when the connection is disconnected.
   * @throws Will throw an error if the connection cannot be disconnected.
   */
  async disconnect(): Promise<void> {}

  /**
   * Returns all the video streams using this.tracks
   * These are the streams we are receiving from the server.
   **/
  getRemoteVideoStreams(): Promise<MediaStream[]> {}

  /**
   * Returns all the audio streams using this.tracks
   * These are the streams we are receiving from the server.
   **/
  getRemoteAudioStreams(): Promise<MediaStream[]> {}
}
