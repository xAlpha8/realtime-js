import { DataChannel } from "./DataChannel";

export class WebSocketDataChannel implements DataChannel<WebSocketDataChannel> {
  dataChannel: WebSocketDataChannel;

  constructor(dataChannel: WebSocketDataChannel) {
    this.dataChannel = dataChannel;
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

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this.dataChannel.send(data);
  }
}
