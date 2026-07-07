/**
 * Live event bus — in-memory pub/sub keyed by characterId.
 *
 * Publishers (tick endpoint, beat advance, spark interaction) push events
 * via `publishLive()`. Subscribers (WebSocket clients listening on
 * /characters/:id/live) receive every event tagged with that characterId.
 *
 * The bus is the seam between Boveda (soul) and downstream consumers
 * (Unreal Editor plugin, ComfyUI, future Twitch overlays). Producers
 * never know who's listening; consumers never know who's producing.
 *
 * Memory: each character keeps a small ring buffer of recent events so
 * a fresh subscriber gets the last few moments on connect (replay).
 *
 * This is in-process only — process restart wipes state. That's fine
 * for now; for cross-process fan-out we'd swap to Redis pub/sub later.
 */

export type LiveEventType = 'tick' | 'interaction' | 'beat_advance' | 'location_change' | 'ping';

export interface LiveEvent {
  type: LiveEventType;
  characterId: string;
  ts: string;
  payload: Record<string, unknown>;
}

type Subscriber = (event: LiveEvent) => void;

const REPLAY_BUFFER = 10;

const subscribersByCharacter = new Map<string, Set<Subscriber>>();
const recentByCharacter = new Map<string, LiveEvent[]>();

/** Publish an event for a specific character. All current subscribers
 *  for that character receive it; the event is also kept in the replay
 *  buffer (last 10) so late-joining clients see recent context. */
export function publishLive(event: Omit<LiveEvent, 'ts'> & { ts?: string }): void {
  const full: LiveEvent = {
    ts: event.ts ?? new Date().toISOString(),
    type: event.type,
    characterId: event.characterId,
    payload: event.payload ?? {},
  };

  const recent = recentByCharacter.get(full.characterId) ?? [];
  recent.push(full);
  while (recent.length > REPLAY_BUFFER) recent.shift();
  recentByCharacter.set(full.characterId, recent);

  const subs = subscribersByCharacter.get(full.characterId);
  if (!subs || subs.size === 0) return;
  for (const fn of subs) {
    try {
      fn(full);
    } catch {
      // A bad subscriber must never crash the publisher loop.
    }
  }
}

/** Subscribe to a character's event stream. Returns an unsubscribe fn.
 *  The subscriber is immediately handed the recent replay buffer so it
 *  doesn't have to wait for the next tick to know what's going on. */
export function subscribeLive(characterId: string, fn: Subscriber): () => void {
  let set = subscribersByCharacter.get(characterId);
  if (!set) {
    set = new Set();
    subscribersByCharacter.set(characterId, set);
  }
  set.add(fn);

  // Replay recent events synchronously (in arrival order).
  const recent = recentByCharacter.get(characterId) ?? [];
  for (const ev of recent) {
    try {
      fn(ev);
    } catch {
      // ignore
    }
  }

  return () => {
    const s = subscribersByCharacter.get(characterId);
    if (!s) return;
    s.delete(fn);
    if (s.size === 0) subscribersByCharacter.delete(characterId);
  };
}

/** For diagnostics: how many subscribers does a character have? */
export function liveSubscriberCount(characterId: string): number {
  return subscribersByCharacter.get(characterId)?.size ?? 0;
}
