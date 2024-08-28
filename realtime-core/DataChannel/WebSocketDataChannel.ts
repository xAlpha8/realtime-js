import { DataChannel } from "./DataChannel";
import { EventEmitter } from 'events';

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

class RtDataChannel extends EventEmitter {
  private socket: WebSocket | null;

  constructor(socket: WebSocket | null = null) {
    super();
    this.socket = socket;
  }

  setSocket(socket: WebSocket | null): void {
    this.socket = socket;
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('WebSocket is not open. Cannot send data.');
    }
  }
}

export { RtDataChannel };

