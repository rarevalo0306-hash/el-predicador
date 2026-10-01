import { createServerFn } from "@tanstack/react-start";

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
