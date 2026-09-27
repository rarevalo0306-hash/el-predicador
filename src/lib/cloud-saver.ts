/**
 * Saves a person's state to their account one request at a time, so an
 * older save can never land after a newer one; retries a failed save after a
 * short wait, and says so when it keeps failing, instead of dropping the
 * change in silence.
 */
export type CloudSaver = {
  /** Something changed: save it after a short pause (several changes, one save). */
  changed: () => void;
  /** Save what is pending now, without waiting (the page is being left). */
  flush: () => void;
  /** Try again after the saver gave up. */
  retry: () => void;
  /** Stop every timer (the account changed or the page closed). */
  stop: () => void;
};

export type SaverOptions = {
  save: () => Promise<unknown>;
  /** Told when saving starts failing for good, and when it works again. */
  onFailing: (failing: boolean) => void;
  /** Pause after a change before saving. */
  debounceMs?: number;
  /** Waits before each retry; after the last one the saver gives up. */
  retryDelaysMs?: readonly number[];
  setTimer?: (run: () => void, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
};

export function createCloudSaver({
  save,
  onFailing,
  debounceMs = 400,
  retryDelaysMs = [2_000, 5_000, 15_000],
  setTimer = (run, ms) => setTimeout(run, ms),
  clearTimer = (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
}: SaverOptions): CloudSaver {
  let timer: unknown = null;
  let saving = false;
  let dirty = false;
  let failures = 0;
  let failing = false;
  let stopped = false;

  const setFailing = (next: boolean) => {
    if (failing === next) return;
    failing = next;
    onFailing(next);
  };

  const cancelTimer = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  const run = () => {
    cancelTimer();
    if (stopped || !dirty) return;
    // One request at a time: a change made meanwhile is saved right after.
    if (saving) return;
    saving = true;
    dirty = false;
    save().then(
      () => {
        saving = false;
        failures = 0;
        setFailing(false);
        if (dirty && !stopped) run();
      },
      () => {
        saving = false;
        dirty = true;
        if (stopped) return;
        const wait = retryDelaysMs[failures];
        failures += 1;
        if (wait === undefined) {
          setFailing(true);
          return;
        }
        timer = setTimer(run, wait);
      },
    );
  };

  return {
    changed() {
      if (stopped) return;
      dirty = true;
      // While it is failing, a new change waits for "retry" rather than
      // hammering the server.
      if (failing) return;
      cancelTimer();
      timer = setTimer(run, debounceMs);
    },
    flush() {
      if (dirty && !failing) run();
    },
    retry() {
      if (stopped) return;
      failures = 0;
      setFailing(false);
      dirty = true;
      run();
    },
    stop() {
      stopped = true;
      cancelTimer();
    },
  };
}
