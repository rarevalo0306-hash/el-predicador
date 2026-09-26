import { create } from "zustand";
import { normalizePhone, restorePhone } from "@/lib/phone";
import type { MessageKind } from "@/lib/messages";
import { persistLocale, type Locale } from "@/lib/i18n";
import { todayKey, type ThemeId, type Verse } from "@/lib/verses";
import { EMPTY_CHURCH, isThemeId, normalizeChurch, type ChurchInfo } from "@/lib/church";
import { recipientThemes } from "@/lib/recipient-themes";
import type { MessageChannel } from "@/lib/message-schedule";
import {
  DEFAULT_BIBLE_VERSIONS,
  normalizeBibleVersion,
  type BibleVersion,
  type BibleVersionPreferences,
} from "@/lib/bible";

export type SentItem = {
  verseId: string;
  at: number;
  note?: string;
  kind?: MessageKind;
  messageLocale?: Locale;
};

export type SavedMessage = {
  id: string;
  verseId: string;
  note?: string;
  kind: MessageKind;
  messageLocale?: Locale;
  at: number;
};

export type ReadingPlace = {
  bookId: string;
  chapter: number;
  verse?: number;
  at: number;
};

export type SendDraft = {
  note?: string;
  kind?: MessageKind | null;
  messageLocale?: Locale;
};

/** People you preach to — phone book + theme + schedules. */
export type Recipient = {
  id: string;
  name: string;
  phone: string;
  at: number;
  /** First of their themes; kept for copies of the app saved before
   *  several themes could be chosen. */
  themeId?: ThemeId;
  /** Themes that interest them, in the order chosen. */
  themeIds?: ThemeId[];
  messageLocale?: Locale;
  /** How this person prefers to be reached. Older contacts have none: they
   *  predate the choice and are treated as WhatsApp, which is what the app
   *  did for everyone before. */
  channel?: MessageChannel;
  notes?: string;
  /** Remind preacher to send a daily verse on their theme. */
  dailyEnabled?: boolean;
  dailyHour?: number;
  lastDailySentDate?: string;
  /** Remind preacher to invite them to church service. */
  cultoEnabled?: boolean;
  lastCultoSentDate?: string;
};

export type RecipientInput = {
  name: string;
  phone: string;
  id?: string;
  themeId?: ThemeId | null;
  themeIds?: ThemeId[];
  messageLocale?: Locale;
  channel?: MessageChannel;
  notes?: string;
  dailyEnabled?: boolean;
  dailyHour?: number;
  cultoEnabled?: boolean;
};

export type CloudPayload = {
  favorites: string[];
  favoriteKinds: Record<string, MessageKind>;
  verseMemory: Record<string, Verse>;
  savedMessages: SavedMessage[];
  displayName: string;
  notify: boolean;
  /** Preferred local hour (0–23) for the daily verse reminder. */
  notifyHour: number;
  recipients: Recipient[];
  church: ChurchInfo;
  sent: SentItem[];
  dailyOffset: number;
  dailyDate: string;
  readingPlace: ReadingPlace | null;
  bookmarks: ReadingPlace[];
  /** Bible verse ids with yellow highlight. */
  highlights: string[];
  /** Reader text size: 0 small … 3 largest. */
  fontScale: 0 | 1 | 2 | 3;
  /** Bible edition chosen independently for Spanish and English. */
  bibleVersions: BibleVersionPreferences;
  locale?: Locale;
};

/** Contacts kept per account; the oldest fall off once it is reached. */
export const MAX_RECIPIENTS = 80;

export const EMPTY_CLOUD: CloudPayload = {
  favorites: [],
  favoriteKinds: {},
  verseMemory: {},
  savedMessages: [],
  displayName: "",
  notify: false,
  notifyHour: 8,
  recipients: [],
  church: { ...EMPTY_CHURCH },
  sent: [],
  dailyOffset: 0,
  dailyDate: "",
  readingPlace: null,
  bookmarks: [],
  highlights: [],
  fontScale: 1,
  bibleVersions: { ...DEFAULT_BIBLE_VERSIONS },
};

function placeKey(place: Pick<ReadingPlace, "bookId" | "chapter" | "verse">) {
  return `${place.bookId}-${place.chapter}-${place.verse ?? 0}`;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type AppState = CloudPayload & {
  locale: Locale;
  toggleFavorite: (id: string, verse?: Verse) => void;
  setFavoriteKind: (id: string, kind: MessageKind) => void;
  rememberVerse: (verse: Verse) => void;
  saveMessage: (item: Omit<SavedMessage, "id" | "at"> & { id?: string }) => SavedMessage | null;
  removeMessage: (id: string) => void;
  setDisplayName: (displayName: string) => void;
  setNotify: (notify: boolean) => void;
  setNotifyHour: (hour: number) => void;
  upsertRecipient: (item: RecipientInput) => Recipient | null;
  removeRecipient: (id: string) => void;
  markRecipientDailySent: (id: string, date?: string) => void;
  markRecipientCultoSent: (id: string, date?: string) => void;
  setChurch: (church: Partial<ChurchInfo>) => void;
  addSent: (item: SentItem) => void;
  bumpOffset: () => void;
  ensureToday: () => void;
  setReadingPlace: (place: ReadingPlace) => void;
  toggleBookmark: (place: ReadingPlace) => void;
  toggleHighlight: (verseId: string, verse?: Verse) => void;
  setFontScale: (scale: 0 | 1 | 2 | 3) => void;
  setBibleVersion: (locale: Locale, version: BibleVersion) => void;
  setLocale: (locale: Locale) => void;
  hydrateFromCloud: (payload: CloudPayload) => void;
  snapshotCloud: () => CloudPayload;
};

export const useAppStore = create<AppState>()((set, get) => ({
  ...EMPTY_CLOUD,
  locale: "es",
  setFavoriteKind: (id, kind) =>
    set((state) => ({
      favoriteKinds: { ...state.favoriteKinds, [id]: kind },
    })),
  rememberVerse: (verse) =>
    set((state) => ({
      verseMemory: { ...state.verseMemory, [verse.id]: verse },
    })),
  toggleFavorite: (id, verse) =>
    set((state) => {
      const saved = state.favorites.includes(id);
      const nextKinds = { ...state.favoriteKinds };
      if (saved) delete nextKinds[id];
      return {
        favorites: saved ? state.favorites.filter((item) => item !== id) : [...state.favorites, id],
        favoriteKinds: nextKinds,
        verseMemory:
          verse && !saved ? { ...state.verseMemory, [verse.id]: verse } : state.verseMemory,
      };
    }),
  saveMessage: (item) => {
    const note = item.note?.trim() || undefined;
    const existing = get().savedMessages.find(
      (entry) =>
        entry.verseId === item.verseId &&
        (entry.note || "") === (note || "") &&
        entry.messageLocale === item.messageLocale,
    );
    if (existing) return null;
    const saved: SavedMessage = {
      id: item.id ?? newId(),
      verseId: item.verseId,
      note,
      kind: item.kind,
      messageLocale: item.messageLocale,
      at: Date.now(),
    };
    set((state) => ({
      savedMessages: [saved, ...state.savedMessages].slice(0, 80),
      favorites: state.favorites.includes(item.verseId)
        ? state.favorites
        : [...state.favorites, item.verseId],
      favoriteKinds: {
        ...state.favoriteKinds,
        [item.verseId]: item.kind,
      },
    }));
    return saved;
  },
  removeMessage: (id) =>
    set((state) => ({
      savedMessages: state.savedMessages.filter((item) => item.id !== id),
    })),
  setDisplayName: (displayName) => set({ displayName }),
  setNotify: (notify) => set({ notify }),
  setNotifyHour: (hour) => set({ notifyHour: Math.min(23, Math.max(0, Math.round(hour) || 8)) }),
  upsertRecipient: (item) => {
    const name = item.name.trim();
    const phone = normalizePhone(item.phone);
    if (!name || !phone) return null;
    const existing = get().recipients.find(
      (row) => row.id === item.id || normalizePhone(row.phone) === phone,
    );
    const chosen = item.themeIds?.filter(isThemeId) ?? [];
    const themeIds = chosen.length
      ? [...new Set(chosen)]
      : item.themeId === null
        ? undefined
        : isThemeId(item.themeId)
          ? [item.themeId]
          : existing
            ? recipientThemes(existing)
            : undefined;
    const themeId = themeIds?.[0];
    const base: Recipient = {
      id: existing?.id ?? item.id ?? newId(),
      name,
      phone,
      at: Date.now(),
      themeId,
      themeIds,
      messageLocale: item.messageLocale ?? existing?.messageLocale ?? get().locale,
      channel: item.channel ?? existing?.channel ?? "whatsapp",
      notes: item.notes !== undefined ? item.notes.trim() || undefined : existing?.notes,
      dailyEnabled:
        item.dailyEnabled !== undefined ? item.dailyEnabled : (existing?.dailyEnabled ?? false),
      dailyHour:
        item.dailyHour !== undefined
          ? Math.min(23, Math.max(0, Math.round(item.dailyHour)))
          : (existing?.dailyHour ?? 9),
      lastDailySentDate: existing?.lastDailySentDate,
      cultoEnabled:
        item.cultoEnabled !== undefined ? item.cultoEnabled : (existing?.cultoEnabled ?? false),
      lastCultoSentDate: existing?.lastCultoSentDate,
    };
    set((state) => ({
      recipients: [base, ...state.recipients.filter((row) => row.id !== base.id)].slice(
        0,
        MAX_RECIPIENTS,
      ),
    }));
    return base;
  },
  removeRecipient: (id) =>
    set((state) => ({
      recipients: state.recipients.filter((row) => row.id !== id),
    })),
  markRecipientDailySent: (id, date) =>
    set((state) => ({
      recipients: state.recipients.map((row) =>
        row.id === id ? { ...row, lastDailySentDate: date ?? todayKey() } : row,
      ),
    })),
  markRecipientCultoSent: (id, date) =>
    set((state) => ({
      recipients: state.recipients.map((row) =>
        row.id === id ? { ...row, lastCultoSentDate: date ?? todayKey() } : row,
      ),
    })),
  setChurch: (partial) =>
    set((state) => ({
      church: normalizeChurch({ ...state.church, ...partial }),
    })),
  addSent: (item) => set((state) => ({ sent: [item, ...state.sent].slice(0, 30) })),
  bumpOffset: () => {
    const today = todayKey();
    const state = get();
    if (state.dailyDate !== today) {
      set({ dailyDate: today, dailyOffset: 1 });
      return;
    }
    set({ dailyOffset: state.dailyOffset + 1 });
  },
  ensureToday: () => {
    const today = todayKey();
    if (get().dailyDate !== today) {
      set({ dailyDate: today, dailyOffset: 0 });
    }
  },
  setReadingPlace: (place) => set({ readingPlace: place }),
  toggleBookmark: (place) =>
    set((state) => {
      const key = placeKey(place);
      const exists = state.bookmarks.some((item) => placeKey(item) === key);
      return {
        bookmarks: exists
          ? state.bookmarks.filter((item) => placeKey(item) !== key)
          : [place, ...state.bookmarks].slice(0, 20),
      };
    }),
  toggleHighlight: (verseId, verse) =>
    set((state) => {
      const on = state.highlights.includes(verseId);
      return {
        highlights: on
          ? state.highlights.filter((id) => id !== verseId)
          : [verseId, ...state.highlights].slice(0, 200),
        verseMemory: verse && !on ? { ...state.verseMemory, [verse.id]: verse } : state.verseMemory,
      };
    }),
  setFontScale: (fontScale) => set({ fontScale }),
  setBibleVersion: (locale, version) =>
    set((state) => ({
      bibleVersions: {
        ...state.bibleVersions,
        [locale]: normalizeBibleVersion(version, locale),
      },
    })),
  setLocale: (locale) => {
    persistLocale(locale);
    set({ locale });
  },
  hydrateFromCloud: (payload) => {
    const locale = payload.locale ?? get().locale;
    persistLocale(locale);
    const scale =
      payload.fontScale === 0 ||
      payload.fontScale === 1 ||
      payload.fontScale === 2 ||
      payload.fontScale === 3
        ? payload.fontScale
        : 1;
    set({
      ...EMPTY_CLOUD,
      ...payload,
      notifyHour:
        typeof payload.notifyHour === "number" && Number.isFinite(payload.notifyHour)
          ? Math.min(23, Math.max(0, Math.round(payload.notifyHour)))
          : 8,
      recipients: Array.isArray(payload.recipients)
        ? payload.recipients.map((row) => ({ ...row, phone: restorePhone(row.phone) }))
        : [],
      church: normalizeChurch(payload.church),
      highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
      fontScale: scale,
      bibleVersions: {
        es: normalizeBibleVersion(payload.bibleVersions?.es, "es") as "recovery" | "lbla",
        en: normalizeBibleVersion(payload.bibleVersions?.en, "en") as "recovery" | "nasb20",
      },
      locale,
    });
  },
  snapshotCloud: () => {
    const state = get();
    return {
      favorites: state.favorites,
      favoriteKinds: state.favoriteKinds,
      verseMemory: state.verseMemory,
      savedMessages: state.savedMessages,
      displayName: state.displayName,
      notify: state.notify,
      notifyHour: state.notifyHour,
      recipients: state.recipients,
      church: state.church,
      sent: state.sent,
      dailyOffset: state.dailyOffset,
      dailyDate: state.dailyDate,
      readingPlace: state.readingPlace,
      bookmarks: state.bookmarks,
      highlights: state.highlights,
      fontScale: state.fontScale,
      bibleVersions: state.bibleVersions,
      locale: state.locale,
    };
  },
}));

export function isSamePlace(
  a: Pick<ReadingPlace, "bookId" | "chapter" | "verse">,
  b: Pick<ReadingPlace, "bookId" | "chapter" | "verse">,
) {
  return placeKey(a) === placeKey(b);
}
