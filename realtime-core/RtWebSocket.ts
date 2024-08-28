import { RtDataChannel } from ".";

class RtWebSocket {
  private socket: WebSocket | null;
  private dataChannel: RtDataChannel;
  private url: string;
  private protocols?: string | string[];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    this.socket = null;
    this.dataChannel = new RtDataChannel();
  }

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    this.socket = new WebSocket(this.url, this.protocols);
    this.dataChannel.setSocket(this.socket);

    this.socket.addEventListener('open', (event) => {
      this.dataChannel.emit('open', event);
    });

    this.socket.addEventListener('close', (event) => {
      this.dataChannel.emit('close', event);
    });

    this.socket.addEventListener('error', (event) => {
      this.dataChannel.emit('error', event);
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === 'message') {
          this.dataChannel.emit('message', { data: parsedData });
        } else {
          const customEvent = new MessageEvent(parsedData.type, { data: parsedData });
          // Dispatch the event on the socket as well
          this.socket!.dispatchEvent(customEvent);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.dataChannel.setSocket(null); // Remove type assertion

    } else {
      console.warn('WebSocket is not connected');
    }
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('WebSocket is not open. Cannot send data.');
    }
  }

  close(code?: number, reason?: string): void {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
      this.dataChannel.setSocket(null);
    }
  }

  addEventListener(type: string, listener: EventListener): void {
    if (this.socket) {
      this.socket.addEventListener(type, listener);
    }
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.socket) {
      this.socket.removeEventListener(type, listener);
    }
  }

  get readyState(): number {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }

  get bufferedAmount(): number {
    return this.socket ? this.socket.bufferedAmount : 0;
  }

  get extensions(): string {
    return this.socket ? this.socket.extensions : '';
  }

  get protocol(): string {
    return this.socket ? this.socket.protocol : '';
  }

  get binaryType(): BinaryType {
    return this.socket ? this.socket.binaryType : 'blob';
  }

  set binaryType(value: BinaryType) {
    if (this.socket) {
      this.socket.binaryType = value;
    }
  }
}
