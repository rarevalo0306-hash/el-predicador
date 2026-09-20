/**
 * Who may open the administrator tab.
 *
 * The owner's account ids are listed in CONTACTS_ADMIN_USER_IDS. Nothing in
 * the app marks an account as the owner, so with the list unset nobody is an
 * administrator, and the tab does not exist for anyone. An empty caller id
 * must never match: an unset list splits to [""].
 */
export function isAdminUser(userId: string, config: Record<string, string | undefined>): boolean {
  if (!userId) return false;
  return (config.CONTACTS_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .includes(userId);
}
