/**
 * Class representing a media track.
 */
export class Track {
  /**
   * Unique identifier for the track.
   */
  id: string;

  /**
   * The underlying media stream.
   */
  stream: MediaStream;

  /**
   * Origin of the track (remote or local).
   */
  origin: "remote" | "local";

  /**
   * Track kind
   */
  kind: "audio" | "video";

  /**
   * The underlying MediaStreamTrack object.
   */
  track: MediaStreamTrack;

  constructor(track: MediaStreamTrack, origin: "remote" | "local") {
    this.id = track.id;
    this.stream = new MediaStream([track]);
    this.origin = origin;
    this.kind = track.kind as "audio" | "video";
    this.track = track;
  }

  /**
   * Pauses the media track.
   */
  pause() {
    this.track.enabled = false;
  }

  /**
   * Resumes the media track.
   */
  resume() {
    this.track.enabled = true;
  }
}
