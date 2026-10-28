import { useId } from "react";
import type { BibleTranslation } from "@/lib/bible";
import type { Locale } from "@/lib/i18n";

export function BibleTranslationSelect({
  value,
  onChange,
  locale,
  disabled = false,
}: {
  value: BibleTranslation;
  onChange: (value: "bsb" | "kjv") => void;
  locale: Locale;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="mt-3 space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {locale === "es" ? "Biblia en inglés" : "English Bible"}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === "kjv" ? "kjv" : "bsb")}
        className="h-11 w-full rounded-md border border-input bg-card px-3 text-base"
      >
        <option value="bsb">Berean Standard Bible (BSB)</option>
        <option value="kjv">King James Version (KJV)</option>
      </select>
    </div>
  );
}
