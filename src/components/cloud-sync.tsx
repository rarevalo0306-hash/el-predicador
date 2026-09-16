import { useEffect, useRef, useState } from "react";
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

function writeGuest(payload: CloudPayload) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

function isEmptyCloud(payload: CloudPayload) {
  return (
    payload.favorites.length === 0 &&
    payload.savedMessages.length === 0 &&
    !payload.displayName
  );
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
    void getMyState()
      .then((payload) => {
        if (cancelled) return;
        const guest = readGuest();
        const cloud = payload ?? EMPTY_CLOUD;
        if (isEmptyCloud(cloud) && guest && !isEmptyCloud(guest)) {
          useAppStore.getState().hydrateFromCloud(guest);
          useAppStore.getState().ensureToday();
          void saveMyState({ data: useAppStore.getState().snapshotCloud() }).catch(
            () => {},
          );
        } else {
          useAppStore.getState().hydrateFromCloud(cloud);
          useAppStore.getState().ensureToday();
        }
        skip.current = false;
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        skip.current = false;
        setReady(true);
      });
    return () => {
      cancelled = true;
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
