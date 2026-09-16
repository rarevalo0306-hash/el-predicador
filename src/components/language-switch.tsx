import { useCallback } from "react";
import { LOCALES, t, type Locale, type StringKey } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function useI18n() {
  const locale = useAppStore((s) => s.locale) ?? "es";
  const setLocale = useAppStore((s) => s.setLocale);
  const translate = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale],
  );
  return {
    locale,
    setLocale,
    t: translate,
  };
}

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t: tr } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-card p-0.5",
        compact ? "" : "w-full max-w-sm",
      )}
      role="group"
      aria-label={tr("language")}
    >
      {LOCALES.map((item) => {
        const active = locale === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocale(item.id as Locale)}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              compact ? "min-w-11 px-3" : "flex-1",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {compact ? item.id.toUpperCase() : item.label}
          </button>
        );
      })}
    </div>
  );
}
