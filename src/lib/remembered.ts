/**
 * One answer per key, kept for as long as the page is open, so coming back
 * to a screen does not ask the server again. A request already on its way
 * is shared rather than sent twice. A failure is not kept, so the next
 * visit tries again. An empty answer is kept only for `keepEmptyMs`,
 * because it may be there a little later.
 */
export type Remembered<T> = {
  /** The kept answer, if there is one still fresh. */
  peek(key: string): T | undefined;
  /** The kept answer, the request already on its way, or a new one. */
  load(key: string, fetch: () => Promise<T>): Promise<T>;
  clear(): void;
};

export function createRemembered<T>(options: {
  keepEmptyMs: number;
  isEmpty: (value: T) => boolean;
  now?: () => number;
}): Remembered<T> {
  const now = options.now ?? Date.now;
  const kept = new Map<string, { value: T; until: number }>();
  const pending = new Map<string, Promise<T>>();

  function peek(key: string): T | undefined {
    const entry = kept.get(key);
    if (!entry) return undefined;
    if (entry.until <= now()) {
      kept.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function load(key: string, fetch: () => Promise<T>): Promise<T> {
    const entry = kept.get(key);
    if (entry && entry.until > now()) return Promise.resolve(entry.value);
    const already = pending.get(key);
    if (already) return already;
    const request = fetch().then(
      (value) => {
        pending.delete(key);
        kept.set(key, {
          value,
          until: options.isEmpty(value) ? now() + options.keepEmptyMs : Infinity,
        });
        return value;
      },
      (error: unknown) => {
        pending.delete(key);
        throw error;
      },
    );
    pending.set(key, request);
    return request;
  }

  return {
    peek,
    load,
    clear() {
      kept.clear();
      pending.clear();
    },
  };
}
