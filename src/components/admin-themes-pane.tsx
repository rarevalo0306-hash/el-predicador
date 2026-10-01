import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextSkeleton } from "@/components/text-skeleton";
import { useI18n } from "@/components/language-switch";
import { useAppStore } from "@/lib/store";
import { localizedTheme, setThemeExtras } from "@/lib/verses";
import {
  expandThemeVerses,
  getThemeExtras,
  getThemeExtrasStatus,
  removeThemeVerse,
  type ThemeExtrasStatus,
} from "@/lib/theme-verses";

/**
 * Admin → Temas: DeepSeek proposes more verses for each theme and the ones
 * that check out (a real passage of one to three verses, not repeated, with
 * its words in the Recovery Version) are published at once. The owner can
 * take any of them out again.
 */
export function AdminThemesPane() {
  const { t, locale } = useI18n();
  const bumpThemeExtras = useAppStore((s) => s.bumpThemeExtras);
  const [status, setStatus] = useState<ThemeExtrasStatus | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [added, setAdded] = useState<{ theme: string; refs: string[] }[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const stop = useRef(false);
  const unmounted = useRef(false);

  async function refresh() {
    setLoadError(false);
    try {
      setStatus(await getThemeExtrasStatus());
      // The rest of the app shows the change right away, not on the next visit.
      setThemeExtras(await getThemeExtras());
      bumpThemeExtras();
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    void refresh();
    return () => {
      unmounted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on open
  }, []);

  // One theme per request, so no call outlives a serverless timeout.
  async function expand(ids: string[]) {
    if (working) return;
    stop.current = false;
    setFailure(null);
    setAdded([]);
    let failed: string | null = null;
    try {
      for (const id of ids) {
        if (stop.current || unmounted.current) break;
        setWorking(id);
        try {
          const result = await expandThemeVerses({ data: { themeId: id } });
          if (result.added.length) {
            setAdded((list) => [
              ...list,
              { theme: localizedTheme(id as never, locale).name, refs: result.added },
            ]);
          }
        } catch (error) {
          failed = error instanceof Error ? error.message : String(error);
          // A rejected or unpaid key fails every theme alike; anything else
          // (a slow answer, a busy moment) only skips this one.
          if (/deepseek_(401|402|403)|not_configured|forbidden/.test(failed)) break;
        }
      }
    } finally {
      if (failed) setFailure(failed);
      setWorking(null);
      await refresh();
    }
  }

  function failureText(code: string) {
    if (/deepseek_(401|403)/.test(code)) return t("adminThemesKeyBad");
    if (code.includes("deepseek_402")) return t("adminThemesNoBalance");
    if (/deepseek_429|deepseek_5\d\d/.test(code)) return t("adminThemesBusy");
    if (/timeout|aborted|deepseek_bad_json|fetch/i.test(code)) return t("adminThemesSlow");
    return t("adminNotesFail", { error: code });
  }

  async function remove(themeId: string, verseId: string) {
    setRemoving(`${themeId}:${verseId}`);
    try {
      await removeThemeVerse({ data: { themeId, verseId } });
      await refresh();
    } finally {
      setRemoving(null);
    }
  }

  if (loadError) {
    return (
      <div role="alert" className="space-y-2 rounded-lg border border-border p-3 text-sm">
        <p>{t("adminThemesLoadError")}</p>
        <Button variant="outline" onClick={() => void refresh()}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  if (!status) return <TextSkeleton label={t("wait")} lines={3} />;

  const totalExtras = status.themes.reduce((sum, theme) => sum + theme.extras.length, 0);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("adminThemesSub")}</p>
      {!status.configured ? (
        <p className="rounded-lg border border-border bg-secondary p-3 text-sm">
          {t("adminNotesKeyMissing")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={working !== null || !status.configured}
          onClick={() => void expand(status.themes.map((theme) => theme.id))}
        >
          {working
            ? t("adminThemesWorking", { theme: localizedTheme(working as never, locale).name })
            : t("adminThemesExpandAll")}
        </Button>
        {working ? (
          <Button type="button" variant="outline" onClick={() => (stop.current = true)}>
            {t("askStop")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("adminThemesTotal", { n: totalExtras })}</p>
      {failure ? (
        <p role="alert" className="text-sm text-destructive">
          {failureText(failure)}
        </p>
      ) : null}
      {added.length ? (
        <div className="rounded-xl border border-primary/30 bg-secondary p-4 text-sm" role="status">
          <p className="font-medium">{t("adminThemesAdded")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {added.map((item) => (
              <li key={item.theme}>
                {item.theme}: {item.refs.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="flex flex-col gap-2">
        {status.themes.map((theme) => {
          const name = localizedTheme(theme.id, locale).name;
          return (
            <li key={theme.id} className="rounded-xl border border-border bg-card p-4 shadow-paper">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium">{name}</span>{" "}
                  <span className="text-muted-foreground">
                    · {t("adminThemesCount", { own: theme.own, extra: theme.extras.length })}
                  </span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={working !== null || !status.configured}
                  onClick={() => void expand([theme.id])}
                >
                  {working === theme.id ? t("wait") : t("adminThemesExpandOne")}
                </Button>
              </div>
              {theme.extras.length ? (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    {t("adminThemesSeeAdded")}
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {theme.extras.map((extra) => (
                      <li key={extra.id} className="flex items-center justify-between gap-2">
                        <span>{extra.ref}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={removing !== null}
                          aria-label={t("adminThemesRemoveAria", { ref: extra.ref, theme: name })}
                          onClick={() => void remove(theme.id, extra.id)}
                        >
                          {removing === `${theme.id}:${extra.id}`
                            ? t("wait")
                            : t("adminThemesRemove")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
