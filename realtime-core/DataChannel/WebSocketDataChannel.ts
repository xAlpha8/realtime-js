import { DataChannel } from "./DataChannel";
import { stringify } from "../utils";

export class WebSocketDataChannel implements DataChannel<WebSocket> {
  dataChannel: WebSocket;

  constructor(socket: WebSocket) {
    this.dataChannel = socket;
  }

  addEventListener(
    type: "message" | "close" | "open",
    listener: EventListener
  ): void {
    this.dataChannel.addEventListener(type, listener);
  }

  removeEventListener(
    type: "message" | "close" | "open",
    listener: EventListener
  ): void {
    this.dataChannel.removeEventListener(type, listener);
  }

  send(payload: { type: string } & { [k in string]: unknown }): void {
    if (this.dataChannel.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    this.dataChannel.send(stringify(payload));
  }
}
