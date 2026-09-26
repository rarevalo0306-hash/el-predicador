import { useEffect, useRef, useState } from "react";
import { isEmptyCloud } from "@/lib/cloud-state";
import { EMPTY_CLOUD, useAppStore, type CloudPayload } from "@/lib/store";
import { getMyState, saveMyState } from "@/lib/user-state";

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

export function useCloudSync(userId: string | undefined, sessionReady: boolean) {
  const [ready, setReady] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    if (!sessionReady) {
      setReady(false);
      skip.current = true;
      return;
    }

    let cancelled = false;
    skip.current = true;

    if (!userId) {
      const guest = readGuest();
      if (guest) useAppStore.getState().hydrateFromCloud(guest);
      useAppStore.getState().ensureToday();
      skip.current = false;
      setReady(true);
      return;
    }

    setReady(false);
    // Hydrating replaces the whole store, so anything typed while this request
    // is in flight would be thrown away. Watch for that, but only trust it when
    // the store started out empty — otherwise the leftovers of whoever was
    // signed in before would ride into this account.
    const startedEmpty = isEmptyCloud(useAppStore.getState().snapshotCloud());
    let touched = false;
    const stopWatching = useAppStore.subscribe(() => {
      touched = true;
    });
    void getMyState()
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
        skip.current = false;
        setReady(true);
      });
    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [userId, sessionReady]);

  useEffect(() => {
    if (!ready || !sessionReady) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useAppStore.subscribe(() => {
      if (skip.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const snap = useAppStore.getState().snapshotCloud();
        if (userId) {
          void saveMyState({ data: snap }).catch(() => {});
        } else {
          writeGuest(snap);
        }
      }, 400);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [ready, sessionReady, userId]);

  return ready;
}
