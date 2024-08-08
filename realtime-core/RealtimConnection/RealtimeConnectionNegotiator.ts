import { TRealtimeConfig } from "../shared/@types";

export class RealtimeConnectionNegotiator {
  peerConnection: RTCPeerConnection;
  private readonly _config: TRealtimeConfig;

  constructor(peerConnection: RTCPeerConnection, config: TRealtimeConfig) {
    this.peerConnection = peerConnection;
    this._config = config;
  }

  /**
   * Negotiate a WebRTC connection. It uses all the private function
   * defined below. Note it will also update this.peerConnection
   */
  async negotiateAndUpdatePeerConnection() {}

  /**
   * Creates and sets the local offer description. It will use this.peerConnection.
   *
   * @returns {Promise<void>} - Resolves when the local description is set.
   * @throws Will throw an error if the local description cannot be set.
   */
  private async _createAndSetLocalOffer() {}

  /**
   * Waits for the ICE gathering to complete. It will use this.peerConnection.
   *
   * @param {AbortSignal} signal - The signal to abort the event listener.
   * @returns {Promise<void>} - Resolves when the ICE gathering is complete.
   */
  private async _waitForIceGathering(signal: AbortSignal) {}

  /**
   * Retrieves the offer URL based on the configuration.
   *
   * @returns {Promise<string>} - The offer URL.
   * @throws Will throw an error if neither offerURL nor functionURL is set.
   */
  private async _getOfferURL() {}

  /**
   * Sends the offer to the specified URL and retrieves the answer.
   *
   * @param {string} offerURL - The URL to send the offer to.
   * @returns {Promise<RTCSessionDescriptionInit>} - The remote answer description.
   * @throws Will throw an error if the fetch request fails.
   */
  private async _sendOfferAndGetAnswer(offerURL: string) {}

  /**
   * Sets the remote description on the peer connection.
   *
   * @param {RTCSessionDescriptionInit} answer - The remote answer description.
   * @returns {Promise<void>} - Resolves when the remote description is set.
   * @throws Will throw an error if the remote description cannot be set.
   */
  private async _setRemoteDescription(answer: RTCSessionDescriptionInit) {}
}
