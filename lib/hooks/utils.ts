export type EventMap = {
    [key: string]: (...args: any[]) => void;
  };
  
  class EventEmitter<Events extends EventMap> {
    private events: Record<keyof Events, Events[keyof Events][]>;
  
    constructor() {
      this.events = {} as Record<keyof Events, Events[keyof Events][]>;
    }
  
    on<E extends keyof Events>(eventName: E, callback: Events[E]): void {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
    }
  
    off<E extends keyof Events>(eventName: E, callback: Events[E]): void {
      if (!this.events[eventName]) return;
      this.events[eventName] = this.events[eventName].filter(
        (fn) => fn !== callback
      );
    }
  
    clean<E extends keyof Events>(eventName: E): void {
      if (!this.events[eventName]) return;
      this.events[eventName] = [] as Events[keyof Events][];
    }
  
    emit<E extends keyof Events>(eventName: E, ...args: Parameters<Events[E]>): void {
      if (!this.events[eventName]) return;
      this.events[eventName].forEach((callback) => callback(...args));
    }
  }
  
  export { EventEmitter };
  