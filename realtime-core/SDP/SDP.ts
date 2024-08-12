/**
 * A class to process session description protocol string.
 *
 * @example
 * const sdp = new SDP()
 * let filteredSDPString = sdp.filter(sdpString, "video", "H264")
 * filteredSDPString = sdp.filter(filteredSDPString, "audio", "PCMU/8000")
 * console.log(filteredSDPString)
 */

export class SDP {
  filter(sdp: string, kind: "audio" | "video", codec: string) {
    const lines = sdp.split("\n");
    const allowed = this._getAllowedCodecs(lines, kind, codec);
    return this._filterSdp(lines, allowed, kind);
  }

  private _escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private _getAllowedCodecs(
    lines: string[],
    kind: string,
    codec: string
  ): number[] {
    const rtxRegex = /a=fmtp:(\d+) apt=(\d+)\r$/;
    const codecRegex = new RegExp(
      `a=rtpmap:([0-9]+) ${this._escapeRegExp(codec)}`
    );
    const allowed: number[] = [];
    let isKind = false;

    for (const line of lines) {
      if (line.startsWith(`m=${kind} `)) {
        isKind = true;
      } else if (line.startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        let match = line.match(codecRegex);
        if (match) {
          allowed.push(parseInt(match[1]));
        }

        match = line.match(rtxRegex);
        if (match && allowed.includes(parseInt(match[2]))) {
          allowed.push(parseInt(match[1]));
        }
      }
    }

    return allowed;
  }
  private _filterSdp(lines: string[], allowed: number[], kind: string): string {
    const skipRegex = /a=(fmtp|rtcp-fb|rtpmap):([0-9]+)/;
    const videoRegex = new RegExp(`(m=${kind} .*?)( ([0-9]+))*\\s*$`);
    let sdp = "";
    let isKind = false;

    for (const line of lines) {
      if (line.startsWith(`m=${kind} `)) {
        isKind = true;
      } else if (line.startsWith("m=")) {
        isKind = false;
      }

      if (isKind) {
        const skipMatch = line.match(skipRegex);
        if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
          continue;
        } else if (line.match(videoRegex)) {
          sdp += line.replace(videoRegex, `$1 ${allowed.join(" ")}`) + "\n";
        } else {
          sdp += line + "\n";
        }
      } else {
        sdp += line + "\n";
      }
    }

    return sdp;
  }
}
