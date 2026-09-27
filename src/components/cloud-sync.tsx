import { useEffect, useRef, useState } from "react";
import { isEmptyCloud } from "@/lib/cloud-state";
import { EMPTY_CLOUD, useAppStore, type CloudPayload } from "@/lib/store";
import { getMyState, saveMyState } from "@/lib/user-state";
import { createCloudSaver, type CloudSaver } from "@/lib/cloud-saver";

const GUEST_KEY = "preacher-guest-state";

function readGuest(): CloudPayload | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CloudPayload;
  } catch {
    return null;
  }
}

/**
 * Contacts kept on this phone without an account go into the first account
 * that signs in with nothing saved yet, then leave the phone, so on a shared
 * phone they cannot follow into someone else's account later.
 */
function clearGuest() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* private mode */
  }
}

function writeGuest(payload: CloudPayload) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

/** How long the saved state may take to arrive before the visit is told so. */
const LOAD_TIMEOUT_MS = 15_000;

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export type CloudSync = {
  /** The page can show the person's things. */
  ready: boolean;
  /** Their saved state could not be read: nothing is saved until it is. */
  loadFailed: boolean;
  retryLoad: () => void;
  /** Changes could not be saved after several tries. */
  saveFailed: boolean;
  retrySave: () => void;
};

export function useCloudSync(userId: string | undefined, sessionReady: boolean): CloudSync {
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const skip = useRef(true);
  const saver = useRef<CloudSaver | null>(null);

  useEffect(() => {
    if (!sessionReady) {
      setReady(false);
      skip.current = true;
      return;
    }

    let cancelled = false;
    if (!userId) {
      const guest = readGuest();
      if (guest) useAppStore.getState().hydrateFromCloud(guest);
      useAppStore.getState().ensureToday();
      skip.current = false;
      setLoadFailed(false);
      setReady(true);
      return;
    }

    setReady(false);
    setLoadFailed(false);
    // Nothing is saved until the account's state has been read: saving over
    // it before then would replace everything the person had.
    skip.current = true;
    // Hydrating replaces the whole store, so anything typed while this request
    // is in flight would be thrown away. Watch for that, but only trust it when
    // the store started out empty — otherwise the leftovers of whoever was
    // signed in before would ride into this account.
    const startedEmpty = isEmptyCloud(useAppStore.getState().snapshotCloud());
    let touched = false;
    const stopWatching = useAppStore.subscribe(() => {
      touched = true;
    });
    void withTimeout(getMyState(), LOAD_TIMEOUT_MS)
      .then((payload) => {
        stopWatching();
        if (cancelled) return;
        const typed = startedEmpty && touched ? useAppStore.getState().snapshotCloud() : null;
        const local = typed && !isEmptyCloud(typed) ? typed : readGuest();
        const cloud = payload ?? EMPTY_CLOUD;
        if (isEmptyCloud(cloud) && local && !isEmptyCloud(local)) {
          useAppStore.getState().hydrateFromCloud(local);
          useAppStore.getState().ensureToday();
          void saveMyState({ data: useAppStore.getState().snapshotCloud() })
            .then(clearGuest)
            .catch(() => {});
        } else {
          useAppStore.getState().hydrateFromCloud(cloud);
          useAppStore.getState().ensureToday();
        }
        skip.current = false;
        setReady(true);
      })
      .catch(() => {
        stopWatching();
        if (cancelled) return;
        // Shown, but never saved: an empty store written over the account
        // would erase what the person had.
        skip.current = true;
        setLoadFailed(true);
        setReady(true);
      });
    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [userId, sessionReady, attempt]);

  useEffect(() => {
    if (!ready || !sessionReady) return;
    const current = createCloudSaver({
      save: () => {
        const snap = useAppStore.getState().snapshotCloud();
        if (!userId) {
          writeGuest(snap);
          return Promise.resolve();
        }
        return saveMyState({ data: snap });
      },
      onFailing: setSaveFailed,
    });
    saver.current = current;
    const unsub = useAppStore.subscribe(() => {
      if (!skip.current) current.changed();
    });
    // Leaving the app (another app, a locked phone, a closed tab) saves what
    // is still waiting instead of losing it.
    const leave = () => current.flush();
    const hidden = () => {
      if (document.visibilityState === "hidden") leave();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    return () => {
      // No last save here: this runs when the account changes (signing out
      // may already have emptied the store), and that must never be saved.
      current.stop();
      unsub();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leave);
      if (saver.current === current) saver.current = null;
    };
  }, [ready, sessionReady, userId]);

  return {
    ready,
    loadFailed,
    retryLoad: () => setAttempt((n) => n + 1),
    saveFailed,
    retrySave: () => saver.current?.retry(),
  };
}
