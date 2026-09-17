import { create } from "zustand";
import type { MessageKind } from "@/lib/messages";
import { persistLocale, type Locale } from "@/lib/i18n";
import { todayKey, type Verse } from "@/lib/verses";

export type SentItem = {
  verseId: string;
  at: number;
  note?: string;
  kind?: MessageKind;
};

export type SavedMessage = {
  id: string;
  verseId: string;
  note?: string;
  kind: MessageKind;
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
};

/** People you preach to — local phone book for WhatsApp / SMS. */
export type Recipient = {
  id: string;
  name: string;
  phone: string;
  at: number;
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
  sent: SentItem[];
  dailyOffset: number;
  dailyDate: string;
  readingPlace: ReadingPlace | null;
  bookmarks: ReadingPlace[];
  locale?: Locale;
};

export const EMPTY_CLOUD: CloudPayload = {
  favorites: [],
  favoriteKinds: {},
  verseMemory: {},
  savedMessages: [],
  displayName: "",
  notify: false,
  notifyHour: 8,
  recipients: [],
  sent: [],
  dailyOffset: 0,
  dailyDate: "",
  readingPlace: null,
  bookmarks: [],
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
  upsertRecipient: (item: { name: string; phone: string; id?: string }) => Recipient | null;
  removeRecipient: (id: string) => void;
  addSent: (item: SentItem) => void;
  bumpOffset: () => void;
  ensureToday: () => void;
  setReadingPlace: (place: ReadingPlace) => void;
  toggleBookmark: (place: ReadingPlace) => void;
  setLocale: (locale: Locale) => void;
  hydrateFromCloud: (payload: CloudPayload) => void;
  snapshotCloud: () => CloudPayload;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

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
        favorites: saved
          ? state.favorites.filter((item) => item !== id)
          : [...state.favorites, id],
        favoriteKinds: nextKinds,
        verseMemory:
          verse && !saved
            ? { ...state.verseMemory, [verse.id]: verse }
            : state.verseMemory,
      };
    }),
  saveMessage: (item) => {
    const note = item.note?.trim() || undefined;
    const existing = get().savedMessages.find(
      (entry) => entry.verseId === item.verseId && (entry.note || "") === (note || ""),
    );
    if (existing) return null;
    const saved: SavedMessage = {
      id: item.id ?? newId(),
      verseId: item.verseId,
      note,
      kind: item.kind,
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
  setNotifyHour: (hour) =>
    set({ notifyHour: Math.min(23, Math.max(0, Math.round(hour) || 8)) }),
  upsertRecipient: (item) => {
    const name = item.name.trim();
    const phone = normalizePhone(item.phone);
    if (!name || phone.length < 7) return null;
    const existing = get().recipients.find(
      (row) => row.id === item.id || normalizePhone(row.phone) === phone,
    );
    if (existing) {
      const next: Recipient = { ...existing, name, phone, at: Date.now() };
      set((state) => ({
        recipients: [
          next,
          ...state.recipients.filter((row) => row.id !== existing.id),
        ],
      }));
      return next;
    }
    const created: Recipient = {
      id: item.id ?? newId(),
      name,
      phone,
      at: Date.now(),
    };
    set((state) => ({
      recipients: [created, ...state.recipients].slice(0, 80),
    }));
    return created;
  },
  removeRecipient: (id) =>
    set((state) => ({
      recipients: state.recipients.filter((row) => row.id !== id),
    })),
  addSent: (item) =>
    set((state) => ({ sent: [item, ...state.sent].slice(0, 30) })),
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
  setLocale: (locale) => {
    persistLocale(locale);
    set({ locale });
  },
  hydrateFromCloud: (payload) => {
    const locale = payload.locale ?? get().locale;
    persistLocale(locale);
    set({
      ...EMPTY_CLOUD,
      ...payload,
      notifyHour:
        typeof payload.notifyHour === "number" && Number.isFinite(payload.notifyHour)
          ? Math.min(23, Math.max(0, Math.round(payload.notifyHour)))
          : 8,
      recipients: Array.isArray(payload.recipients) ? payload.recipients : [],
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
      sent: state.sent,
      dailyOffset: state.dailyOffset,
      dailyDate: state.dailyDate,
      readingPlace: state.readingPlace,
      bookmarks: state.bookmarks,
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

