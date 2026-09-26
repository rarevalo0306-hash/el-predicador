import { bibleSource } from "@/lib/bible";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { hydrateVerse, peekHydratedVerse } from "@/lib/recobro";
import type { Verse } from "@/lib/verses";
import { useAppStore } from "@/lib/store";

export function useHydratedVerse(verse: Verse | null, locale: Locale) {
  const bibleVersion = useAppStore((s) => s.bibleVersions[locale]);
  const verseId = verse?.id ?? "";
  const verseRef = useRef(verse);
  verseRef.current = verse;
  const peeked = verse ? peekHydratedVerse(verse, locale, bibleVersion) : null;
  const [hydrated, setHydrated] = useState<Verse | null>(peeked);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const current = verseRef.current;
    if (!current) {
      setHydrated(null);
      setError(null);
      return;
    }
    const ready = peekHydratedVerse(current, locale, bibleVersion);
    if (ready) {
      setHydrated(ready);
      setError(null);
      return;
    }
    let cancelled = false;
    setHydrated((prev) => (prev?.id === current.id ? prev : null));
    setError(null);
    void hydrateVerse(current, locale, bibleVersion)
      .then((result) => {
        if (cancelled) return;
        setHydrated(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [verseId, locale, bibleVersion, tick]);

  const shown =
    peeked ??
    (hydrated &&
    hydrated.id === verseId &&
    hydrated.source === bibleSource(bibleVersion, locale)
      ? hydrated
      : null);

  return {
    verse: shown,
    loading: Boolean(verse) && !shown && !error,
    error,
    retry: () => setTick((n) => n + 1),
  };
}
