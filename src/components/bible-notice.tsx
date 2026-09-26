import { verseNotice } from "@/lib/bible-notice";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The edition's copyright line, in small print under its text. */
export function BibleNotice({
  verse,
  locale,
  className,
}: {
  verse: { copyright?: string | null; source?: string | null };
  locale: Locale;
  className?: string;
}) {
  const notice = verseNotice(verse, locale);
  if (!notice) return null;
  return (
    <p className={cn("text-[0.7rem] leading-snug break-words text-muted-foreground", className)}>
      {notice}
    </p>
  );
}
