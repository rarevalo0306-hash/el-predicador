import { useEffect } from "react";
import { reportBibleView } from "@/lib/api-bible-views";
/** Render the publisher's complete response verbatim; React escapes any markup. */
export function BibleCopyright({
  notice,
  fumsToken,
  fumsId,
}: {
  notice?: string;
  fumsToken?: string;
  fumsId?: string;
}) {
  useEffect(() => {
    if (notice) reportBibleView({ fumsToken, fumsId });
  }, [notice, fumsToken, fumsId]);
  if (!notice) return null;
  return (
    <p
      className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground"
      data-bible-copyright
    >
      {notice}{" "}
      <a href="https://api.bible" target="_blank" rel="noopener noreferrer" className="underline">
        API.Bible
      </a>
    </p>
  );
}
