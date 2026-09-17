import { useId } from "react";
import { useI18n } from "@/components/language-switch";
import { Label } from "@/components/ui/label";
import { messageLanguageCopy } from "@/lib/message-language";
import type { Locale } from "@/lib/i18n";

export function MessageLanguageSelect({
  value,
  onChange,
  disabled = false,
  hint,
}: {
  value: Locale;
  onChange: (value: Locale) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const id = useId();
  const { locale } = useI18n();
  const copy = messageLanguageCopy(locale);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{copy.label}</Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Locale)}
        aria-describedby={`${id}-hint`}
        className="h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint ?? copy.hint}
      </p>
    </div>
  );
}
