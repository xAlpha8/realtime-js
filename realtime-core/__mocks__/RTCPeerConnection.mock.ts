import { vi } from "vitest";

export class RTCPeerConnection {
  localDescription: string | null;
  remoteDescription: string | null;
  iceConnectionState:
    | "new"
    | "checking"
    | "connected"
    | "completed"
    | "failed"
    | "disconnected"
    | "closed";

  eventListeners: Record<string, ((e: unknown) => void)[]>;

  // Mock methods using vi.fn()
  addEventListener = vi.fn((event: string, listener: (e: unknown) => void) => {
    this.eventListeners[event] = this.eventListeners[event] || [];
    this.eventListeners[event].push(listener);
  });

  removeEventListener = vi.fn(
    (event: string, listener: (e: unknown) => void) => {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          (l) => l !== listener
        );
      }
    }
  );

  dispatchEvent = vi.fn((event: { type: string }) => {
    if (this.eventListeners[event.type]) {
      this.eventListeners[event.type].forEach((listener) => listener(event));
    }
  });

  createOffer = vi.fn(() =>
    Promise.resolve({ type: "offer", sdp: "mock-sdp-offer" })
  );

  createAnswer = vi.fn(() =>
    Promise.resolve({ type: "answer", sdp: "mock-sdp-answer" })
  );

  setLocalDescription = vi.fn((description: string) => {
    this.localDescription = description;
    this.iceConnectionState = "checking";
  });

  setRemoteDescription = vi.fn((description: string) => {
    this.remoteDescription = description;
    this.iceConnectionState = "connected";
  });

  addTrack = vi.fn();

  addTransceiver = vi.fn();
}
