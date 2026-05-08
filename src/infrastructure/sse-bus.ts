// Event bus em memória para SSE (Arquitetura §2.2).
// Em produção: substituir por Redis pub/sub ou Postgres LISTEN/NOTIFY.

type Listener = (event: BusEvent) => void;

export interface BusEvent {
  channel: string;
  type: string;
  payload: unknown;
  id: number;
  emittedAt: Date;
}

class EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private nextId = 1;
  // Buffer de últimos eventos por canal para Last-Event-ID (TTL leve em memória)
  private buffer = new Map<string, BusEvent[]>();
  private readonly bufferLimit = 200;

  emit(channel: string, type: string, payload: unknown): void {
    const event: BusEvent = {
      channel,
      type,
      payload,
      id: this.nextId++,
      emittedAt: new Date()
    };
    const buf = this.buffer.get(channel) ?? [];
    buf.push(event);
    while (buf.length > this.bufferLimit) buf.shift();
    this.buffer.set(channel, buf);
    const set = this.listeners.get(channel);
    if (set) for (const l of set) l(event);
  }

  subscribe(channel: string, listener: Listener): () => void {
    let set = this.listeners.get(channel);
    if (!set) {
      set = new Set();
      this.listeners.set(channel, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.listeners.delete(channel);
    };
  }

  replayAfter(channel: string, lastEventId: number): BusEvent[] {
    const buf = this.buffer.get(channel) ?? [];
    return buf.filter((e) => e.id > lastEventId);
  }
}

const globalBus = globalThis as unknown as { __scBus?: EventBus };
export const bus: EventBus = globalBus.__scBus ?? new EventBus();
if (!globalBus.__scBus) globalBus.__scBus = bus;
