import { TLogger, TRealtimeConfig, TResponse } from "../shared/@types";
import SDP from "../SDP";
import { fetchWithRetry, isAValidRTCSessionDescription } from "../utils";

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
   * Negotiate a WebRTC connection. It uses all the private function
   * defined below.
   */
  async negotiateAndUpdatePeerConnection(): Promise<TResponse<string>> {
    let response = await this._createAndSetLocalOffer();

    if (!response.ok) {
      return {
        error: "Failed to create and set local offer.",
      };
    }

    response = await this._waitForIceGathering();

    if (!response.ok) {
      return {
        error: "Failed to find compatible ICE candidate for the connection.",
      };
    }

    response = await this._getOfferURL();

    if (!response.ok) {
      return {
        error: "Failed during getting offer URL.",
      };
    }

    const offerURL = response.data as string;

    response = this._modifySDPBeforeSendingOffer();

    if (!response.ok) {
      return {
        error: "Failed during modifying sdp before sending offer.",
      };
    }

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

    return {
      ok: true,
    };
  }

  /**
   * Creates and sets the local offer description.
   */
  private async _createAndSetLocalOffer(): Promise<TResponse> {
    try {
      const offer = await this._peerConnection.createOffer();
      this._peerConnection.setLocalDescription(offer);
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
   * Waits for the ICE gathering to complete.
   *
   * @returns {Promise<void>} - Resolves when the ICE gathering is complete.
   */
  private async _waitForIceGathering(): Promise<TResponse> {
    try {
      if (this._peerConnection.iceConnectionState === "connected") {
        return {
          ok: true,
        };
      }

      await new Promise((resolve, reject) => {
        const checkState = () => {
          if (this._peerConnection.iceConnectionState === "completed") {
            this._peerConnection.removeEventListener(
              "icegatheringstatechange",
              checkState
            );
            resolve("connected");
          } else if (
            this._peerConnection.iceConnectionState === "failed" ||
            this._peerConnection.iceConnectionState === "closed"
          ) {
            reject("failed");
          }
        };

        this._peerConnection.addEventListener(
          "iceconnectionstatechange",
          checkState
        );
      });

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
   * Retrieves the offer URL based on the configuration.
   *
   */
  private async _getOfferURL(): Promise<TResponse> {
    try {
      const response = await fetchWithRetry(this._config.functionURL);
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
   * Modify audio and video codec after reading config.
   */
  private _modifySDPBeforeSendingOffer(): TResponse {
    if (!this._peerConnection.localDescription?.sdp) {
      this._logger?.error(
        this._logLabel,
        "localDescription is not set to the peer connection, of the localDescription set doesn't have sdp."
      );

      return {
        error: "localDescription.sdp is not defined.",
      };
    }
    const sdp = new SDP();

    let modifiedSDP = this._peerConnection.localDescription.sdp;

    if (
      typeof this._config.audio === "object" &&
      this._config.audio.codec &&
      this._config.audio.codec !== "default"
    ) {
      modifiedSDP = sdp.filter(modifiedSDP, "audio", this._config.audio.codec);
    }

    if (
      typeof this._config.video === "object" &&
      this._config.video.codec &&
      this._config.video.codec !== "default"
    ) {
      modifiedSDP = sdp.filter(modifiedSDP, "video", this._config.video.codec);
    }

    return {
      ok: true,
      data: new RTCSessionDescription({
        type: this._peerConnection.localDescription.type,
        sdp: modifiedSDP,
      }),
    };
  }

  /**
   * Sends the offer to the specified URL, retrieves the answer and
   * update peer connection remote description.
   */
  private async _sendOfferAndSetRemoteDescription(
    offerURL: string,
    description: RTCSessionDescription
  ): Promise<TResponse> {
    try {
      let videoTransform = "none";

      if (
        typeof this._config.video === "object" &&
        this._config.video.transform
      ) {
        videoTransform = this._config.video.transform;
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
