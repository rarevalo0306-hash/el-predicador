import { EMPTY_CHURCH, type ChurchInfo } from "./church.ts";
import type { CloudPayload } from "./store.ts";

/** True when the owner has not set anything about their congregation. */
function isEmptyChurch(church: ChurchInfo | undefined): boolean {
  if (!church) return true;
  return (
    !church.name.trim() &&
    !church.address.trim() &&
    !church.city.trim() &&
    !church.note.trim() &&
    church.serviceTime === EMPTY_CHURCH.serviceTime &&
    church.reminderHoursBefore === EMPTY_CHURCH.reminderHoursBefore &&
    church.serviceDays.length === EMPTY_CHURCH.serviceDays.length &&
    church.serviceDays.every((day, i) => day === EMPTY_CHURCH.serviceDays[i])
  );
}

/**
 * True when a payload holds no work its owner would miss.
 *
 * This decides whether local state is worth keeping when an account's stored
 * state turns out to be empty, so it has to name EVERY collection the owner
 * fills in. Leaving one out loses exactly that data: contacts added before
 * signing in were dropped on sign-in, and the save that followed wrote the
 * emptied state back over the account. Preferences (reading position, text
 * size, language, reminder toggles) are deliberately not work: they carry
 * defaults on their own and would make an untouched visit look occupied.
 */
export function isEmptyCloud(payload: CloudPayload | null | undefined): boolean {
  if (!payload) return true;
  return (
    !payload.favorites?.length &&
    !payload.savedMessages?.length &&
    !payload.recipients?.length &&
    !payload.bookmarks?.length &&
    !payload.highlights?.length &&
    !payload.sent?.length &&
    !payload.displayName?.trim() &&
    isEmptyChurch(payload.church)
  );
}
