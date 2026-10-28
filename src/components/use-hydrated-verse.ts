import { bibleErrorCopy } from "@/lib/bible-error-copy";
import { recobroSource, defaultBibleTranslation } from "@/lib/bible";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { hydrateVerse, peekHydratedVerse } from "@/lib/recobro";
import { isComposedVerse, type Verse } from "@/lib/verses";

export function useHydratedVerse(
  verse: Verse | null,
  locale: Locale,
  translation = defaultBibleTranslation(locale),
) {
  const verseId = verse?.id ?? "";
  const verseRef = useRef(verse);
  verseRef.current = verse;
  const peeked = verse ? peekHydratedVerse(verse, locale, translation) : null;
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
    const ready = peekHydratedVerse(current, locale, translation);
    if (ready) {
      setHydrated(ready);
      setError(null);
      return;
    }
    let cancelled = false;
    setHydrated((prev) => (prev?.id === current.id ? prev : null));
    setError(null);
    void hydrateVerse(current, locale, translation)
      .then((result) => {
        if (cancelled) return;
        setHydrated(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(bibleErrorCopy(err, locale));
      });
    return () => {
      cancelled = true;
    };
  }, [verseId, locale, translation, tick]);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const shown =
    peeked ??
    (hydrated &&
    hydrated.id === verseId &&
    (hydrated.source === recobroSource(locale, translation) || isComposedVerse(hydrated.id)) &&
    (!hydrated.expiresAt || hydrated.expiresAt > Date.now())
      ? hydrated
      : null);

  return {
    verse: shown,
    loading: Boolean(verse) && !shown && !error,
    error,
    retry: () => setTick((n) => n + 1),
  };
}
