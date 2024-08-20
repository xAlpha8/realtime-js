import { TLogger, TRealtimeConfig, TResponse } from "../shared/@types";
import { SDP } from "../SDP";
import { fetchWithRetry, isAValidRTCSessionDescription } from "../utils";

/**
 * Handles the negotiation of WebRTC connections, including creating offers,
 * modifying SDP, and setting remote descriptions.
 */
export class RealtimeConnectionNegotiator {
  private _peerConnection: RTCPeerConnection;
  private readonly _config: TRealtimeConfig;
  private _logger: TLogger | undefined;
  private _logLabel = "RealtimeConnectionNegotiator";

  constructor(peerConnection: RTCPeerConnection, config: TRealtimeConfig) {
    this._peerConnection = peerConnection;
    this._config = config;
    this._logger = this._config.logger;
  }

  /**
   * Negotiates and updates the WebRTC peer connection by creating an offer,
   * modifying SDP, and setting the remote description.
   * @returns {Promise<TResponse<string>>} A promise that resolves with the negotiation result.
   */
  async negotiateAndUpdatePeerConnection(): Promise<TResponse<string>> {
    let response = await this._createAndSetLocalOffer();

    if (!response.ok) {
      return {
        error: "Failed to create and set local offer.",
      };
    }

    this._logger?.log(this._logLabel, "Offer created successfully!");

    let offerURL = this._config.offerURL;

    if (!offerURL) {
      response = await this._getOfferURL();

      if (!response.ok) {
        return {
          error: "Failed during getting offer URL.",
        };
      }

      offerURL = response.data as string;
    }

    this._logger?.log(this._logLabel, "Retrieve offer URL.");

    response = this._modifySDPBeforeSendingOffer();

    if (!response.ok) {
      return {
        error: "Failed during modifying sdp before sending offer.",
      };
    }

    this._logger?.log(this._logLabel, "Modified SDP.");

    const newDescription = response.data as RTCSessionDescription;

    response = await this._sendOfferAndSetRemoteDescription(
      offerURL,
      newDescription
    );

    if (!response.ok) {
      return {
        error:
          "Failed during sending offer or during setting remote description.",
      };
    }

    this._logger?.log(this._logLabel, "Successfully set remote description!");

    return {
      ok: true,
    };
  }

  /**
   * Creates and sets the local offer description.
   * @returns {Promise<TResponse>} A promise that resolves with the result of the operation.
   */
  private async _createAndSetLocalOffer(): Promise<TResponse> {
    try {
      const gatherStatePromise = new Promise((resolve) => {
        const checkIceGatheringState = () => {
          this._logger?.log(
            this._logLabel,
            `Gather State: ${this._peerConnection.iceGatheringState}`
          );

          if (this._peerConnection.iceGatheringState === "complete") {
            this._peerConnection.removeEventListener(
              "icegatheringstatechange",
              checkIceGatheringState
            );
            resolve(true);
          }
        };

        this._peerConnection.addEventListener(
          "icegatheringstatechange",
          checkIceGatheringState
        );
        if (this._peerConnection.iceGatheringState === "complete") {
          resolve(true);
        }
      });

      const offer = await this._peerConnection.createOffer();
      const setLocalDescriptionPromise =
        this._peerConnection.setLocalDescription(offer);

      await Promise.all([setLocalDescriptionPromise, gatherStatePromise]);

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

  /**
   * Fetches the offer URL by making a get request to the function URL.
   * @returns {Promise<TResponse>} A promise that resolves with the offer URL.
   */
  private async _getOfferURL(): Promise<TResponse> {
    try {
      const response = await fetchWithRetry(
        this._config.functionURL,
        undefined,
        7
      );
      const payload = (await response.json()) as unknown;

      if (!payload || typeof payload !== "object") {
        throw new Error(
          `Payload is undefined or not an object. Type: ${typeof payload}`
        );
      }

      if (
        !("address" in payload) ||
        typeof payload.address !== "string" ||
        !payload.address
      ) {
        throw new Error(
          `Response doesn't contain offer url. Response: ${JSON.stringify(
            payload
          )}`
        );
      }

      const offerURL = payload.address + "/offer";

      return {
        ok: true,
        data: offerURL,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

  /**
   * If needed, modifies the SDP of the offer before sending it.
   * @returns {TResponse} The result of the SDP modification.
   */
  private _modifySDPBeforeSendingOffer(): TResponse {
    try {
      if (!this._peerConnection.localDescription?.sdp) {
        this._logger?.error(
          this._logLabel,
          "localDescription is not set to the peer connection, of the localDescription set doesn't have sdp."
        );

        return {
          error: "localDescription.sdp is not defined.",
        };
      }

      let modifiedSDP = this._peerConnection.localDescription.sdp;

      if (
        typeof this._config.codec === "object" &&
        this._config.codec.audio &&
        this._config.codec.audio !== "default"
      ) {
        modifiedSDP = SDP.filter(
          modifiedSDP,
          "audio",
          this._config.codec.audio
        );
      }

      if (
        typeof this._config.codec === "object" &&
        this._config.codec.video &&
        this._config.codec.video !== "default"
      ) {
        modifiedSDP = SDP.filter(
          modifiedSDP,
          "video",
          this._config.codec.video
        );
      }

      return {
        ok: true,
        data: new RTCSessionDescription({
          type: this._peerConnection.localDescription.type,
          sdp: modifiedSDP,
        }),
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }

  /**
   * Sends the offer to the offer URL, retrieves the answer, and updates the peer connection's remote description.
   *
   * @param {string} offerURL - The URL to which the offer is sent.
   * @param {RTCSessionDescription} description - The SDP description to be sent.
   * @returns {Promise<TResponse>} A promise that resolves with the result of the operation.
   */
  private async _sendOfferAndSetRemoteDescription(
    offerURL: string,
    description: RTCSessionDescription
  ): Promise<TResponse> {
    try {
      let videoTransform = "none";

      if (
        typeof this._config.video === "object" &&
        this._config.videoTransform
      ) {
        videoTransform = this._config.videoTransform;
      }

      const response = await fetchWithRetry(
        offerURL,
        {
          body: JSON.stringify({
            sdp: description.sdp,
            type: description.type,
            video_transform: videoTransform,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
        7
      );

      const answer = (await response.json()) as unknown;

      if (!isAValidRTCSessionDescription(answer)) {
        throw new Error("Response is not an valid RTCSessionDescriptionInit.");
      }

      this._peerConnection.setRemoteDescription(answer);

      return {
        ok: true,
      };
    } catch (error) {
      this._logger?.error(this._logLabel, error);
      return {
        error,
      };
    }
  }
}
