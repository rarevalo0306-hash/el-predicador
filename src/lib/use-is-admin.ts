import { useEffect, useState } from "react";
import { getAdminStatus } from "@/lib/admin";

/**
 * Whether the signed-in account may see the administrator tab. Answered by
 * the server, so the tab cannot be shown by editing anything in the browser;
 * the data behind it is refused server-side as well.
 */
export function useIsAdmin(userId: string | undefined): boolean {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setAdmin(false);
      return;
    }
    getAdminStatus()
      .then((result) => {
        if (!cancelled) setAdmin(result.admin);
      })
      .catch(() => {
        if (!cancelled) setAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return admin;
}
