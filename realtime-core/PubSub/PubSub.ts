export class PubSub {
  private events: Record<string, Array<() => void>> = {};

  // Method to add event listeners
  addEventListener<T extends () => void>(event: string, listener: T) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(listener);
  }

  // Method to remove event listeners
  removeEventListener<T extends () => void>(event: string, listener: T) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }

  // Method to dispatch events
  dispatchEvent(event: { type: string }) {
    if (this.events[event.type]) {
      this.events[event.type].forEach((listener) => listener());
    }
  }
}
