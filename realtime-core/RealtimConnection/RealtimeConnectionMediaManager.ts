/**
 * This class handles getting access of all the media devices after reading the config
 */
export class RealtimeConnectionMediaManager {
  private peerConnection: RTCPeerConnection;

  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
  }
  /**
   * Adds track to peerConnection.
   */
  async addTracksToPeerConnection() {}

  /**
   * Gets all the required media access by reading the config
   * and returns all the media stream.
   *
   * @returns {Promise<MediaStream[]>} - Resolves when media access is obtained.
   * @throws Will throw an error if media access cannot be obtained.
   */
  async getMediaStreams(): Promise<MediaStream[]> {}

  /**
   * Gets user media access (e.g., camera and microphone).
   
   * @param {MediaTrackConstraints} constaints - Audio or video constraints.
   * @returns {Promise<MediaStream>} - Resolves with the MediaStream object if access is granted.
   * @throws Will throw an error if user media access cannot be obtained.
   */
  async getUserMediaAccess(
    constraints: MediaTrackConstraints
  ): Promise<MediaStream> {}

  /**
   * Gets user display access (e.g., screen sharing).
   *
   * @param {DisplayMediaStreamOptions} constaints - Screen share constraints.
   * @returns {Promise<MediaStream>} - Resolves with the MediaStream object if access is granted.
   * @throws Will throw an error if user display access cannot be obtained.
   */
  async getUserDisplayAccess(
    constraints: DisplayMediaStreamOptions
  ): Promise<MediaStream> {}
}
