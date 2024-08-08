/**
 * A class to process session description protocol string.
 *
 * @example
 * const sdp = new SDP(sdpString)
 * const filteredSDPString = sdp.filter("video", "H264")
 * console.log(filteredSDPString)
 */
export class SDP {
  sdp: string;

  constructor(sdp: string) {
    this.sdp = sdp;
  }

  filter(kind: string, codec: string) {}

  private _escapeRegExp(string: string): string;
  private _getAllowedCodecs(lines: string[]): number[];
  private _filter(lines: string[], allowed: []): string;
}
