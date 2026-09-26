import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

/**
 * Whether the Recovery Version can be read: only once Living Stream
 * Ministry's official access (LSM_APPID and LSM_TOKEN) is configured on the
 * server. Says yes or no; never sends the keys.
 */
export const getBibleAvailability = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ recovery: boolean }> => {
    const { lsmCredentials } = await import("@/lib/lsm-api");
    return { recovery: Boolean(lsmCredentials()) };
  },
);

let known: Promise<boolean> | null = null;

/** Recobro's availability, asked once per visit; false until known. */
export function useRecoveryAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    known ??= getBibleAvailability()
      .then((result) => result.recovery)
      .catch(() => {
        known = null;
        return false;
      });
    void known.then((value) => {
      if (!cancelled) setAvailable(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}
