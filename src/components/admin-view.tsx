import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import { getAdminOverview, type AdminOverview } from "@/lib/admin";
import {
  getVerseNotesStatus,
  prepareVerseNotes,
  resetVerseNotes,
  type NotesStatus,
  type PrepareResult,
} from "@/lib/admin-notes";
import { useAppStore } from "@/lib/store";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Pane = "registrations" | "accounts" | "notes";

function csvOf(header: string[], rows: (string | number)[][]) {
  const line = (cells: (string | number)[]) =>
    cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",");
  return [line(header), ...rows.map(line)].join("\n");
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminView() {
  const { t, locale } = useI18n();
  const [pane, setPane] = useState<Pane>("registrations");
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState(false);
  const recipients = useAppStore((s) => s.recipients);
  const upsertRecipient = useAppStore((s) => s.upsertRecipient);
  const [notes, setNotes] = useState<NotesStatus | null>(null);
  const [working, setWorking] = useState<"es" | "en" | null>(null);
  const [sample, setSample] = useState<PrepareResult["sample"]>([]);
  const [noteErrors, setNoteErrors] = useState<string[]>([]);
  const [noteFailure, setNoteFailure] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<"es" | "en" | null>(null);
  const cancelled = useRef(false);
  useEffect(() => {
    getVerseNotesStatus()
      .then(setNotes)
      .catch(() => setNotes(null));
    return () => {
      cancelled.current = true;
    };
  }, []);
  // Runs one batch at a time until nothing remains, so no single request has
  // to outlive a serverless timeout; a failure stops here and says why.
  async function prepare(locale: "es" | "en", fresh = false) {
    setWorking(locale);
    setRegenerating(null);
    setNoteFailure(null);
    setNoteErrors([]);
    try {
      if (fresh) {
        // The old lines go first, then the loop below writes them all again.
        await resetVerseNotes({ data: { locale } });
        setNotes(await getVerseNotesStatus());
      }
      let remaining = Infinity;
      while (remaining > 0 && !cancelled.current) {
        const result = await prepareVerseNotes({ data: { locale } });
        remaining = result.remaining;
        if (result.sample.length) setSample(result.sample);
        if (result.errors.length) setNoteErrors((e) => [...e, ...result.errors]);
        setNotes(await getVerseNotesStatus());
        if (!result.processed) break;
      }
    } catch (error) {
      setNoteFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setWorking(null);
    }
  }

  const load = () => {
    setError(false);
    getAdminOverview()
      .then(setData)
      .catch(() => setError(true));
  };
  useEffect(load, []);

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const known = new Set(recipients.map((r) => normalizePhone(r.phone)));

  return (
    <section className="space-y-4 pb-24">
      <div>
        <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
          {t("adminKicker")}
        </p>
        <h2 className="font-serif text-2xl tracking-tight">{t("adminTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminSub")}</p>
      </div>
      <div
        className="inline-flex w-full rounded-full border border-border bg-card p-0.5"
        role="tablist"
      >
        {(["registrations", "accounts", "notes"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pane === id}
            onClick={() => setPane(id)}
            className={cn(
              "h-11 flex-1 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              pane === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {id === "registrations"
              ? t("adminRegistrations")
              : id === "accounts"
                ? t("adminAccounts")
                : t("adminNotes")}
            {data && id !== "notes"
              ? ` · ${id === "registrations" ? data.registrations.length : data.accounts.length}`
              : ""}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <p>{t("adminLoadError")}</p>
          <Button variant="outline" onClick={load}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {!data && !error ? <p role="status">{t("wait")}</p> : null}

      {data && pane === "registrations" ? (
        <div className="space-y-3">
          {data.registrations.length ? (
            <Button
              variant="outline"
              onClick={() =>
                download(
                  "the-preacher-registros.csv",
                  csvOf(
                    ["fecha", "nombre", "email", "telefono", "direccion", "idioma"],
                    data.registrations.map((r) => [
                      r.createdAt,
                      r.name,
                      r.email,
                      r.phone,
                      r.address,
                      r.locale,
                    ]),
                  ),
                )
              }
            >
              {t("peopleCsv")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("adminNoRegistrations")}</p>
          )}
          {data.registrations.map((row) => {
            const added = known.has(normalizePhone(row.phone));
            return (
              <article
                key={row.id}
                className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-paper"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium">{row.name}</h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {formatPhone(row.phone)} · {row.email}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">{row.address}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {dateLabel(row.createdAt)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant={added ? "outline" : "default"}
                  disabled={added}
                  onClick={() => {
                    const saved = upsertRecipient({
                      name: row.name,
                      phone: row.phone,
                      messageLocale: row.locale === "en" ? "en" : "es",
                    });
                    toast(saved ? t("adminAdded", { name: row.name }) : t("contactBadPhone"));
                  }}
                >
                  {added ? t("adminAlreadyAdded") : t("adminAddToPeople")}
                </Button>
              </article>
            );
          })}
        </div>
      ) : null}

      {data && pane === "accounts" ? (
        <div className="space-y-3">
          {data.accounts.length ? (
            <Button
              variant="outline"
              onClick={() =>
                download(
                  "the-preacher-cuentas.csv",
                  csvOf(
                    ["fecha", "nombre", "email", "personas", "programaciones"],
                    data.accounts.map((a) => [a.createdAt, a.name, a.email, a.people, a.schedules]),
                  ),
                )
              }
            >
              {t("peopleCsv")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("adminNoAccounts")}</p>
          )}
          {data.accounts.map((row) => (
            <article
              key={row.id}
              className="space-y-1 rounded-xl border border-border bg-card p-4 shadow-paper"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium">{row.name || row.email}</h3>
                  <p className="text-sm text-muted-foreground break-words">{row.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {dateLabel(row.createdAt)}
                </span>
              </div>
              <p className="text-sm">
                {t("adminPeopleCount", { n: row.people })} ·{" "}
                {t("adminSchedulesCount", { n: row.schedules })}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {pane === "notes" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("adminNotesSub")}</p>
          {notes && !notes.configured ? (
            <p className="rounded-lg border border-border bg-secondary p-3 text-sm">
              {t("adminNotesKeyMissing")}
            </p>
          ) : null}
          {(["es", "en"] as const).map((lang) => {
            const done = notes?.prepared[lang] ?? 0;
            const total = notes?.total ?? 0;
            const complete = total > 0 && done >= total;
            return (
              <article
                key={lang}
                className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-paper"
              >
                <p className="text-sm font-medium">
                  {lang === "es" ? "Español" : "English"} ·{" "}
                  {t("adminNotesProgress", { done, total })}
                </p>
                {complete ? (
                  <p className="text-sm text-primary">
                    {t("adminNotesDone", { lang: lang === "es" ? "español" : "English" })}
                  </p>
                ) : (
                  <Button
                    type="button"
                    disabled={working !== null || !notes?.configured}
                    onClick={() => void prepare(lang)}
                  >
                    {working === lang
                      ? t("adminNotesWorking", { done, total })
                      : t("adminNotesPrepare", { lang: lang === "es" ? "español" : "English" })}
                  </Button>
                )}
                {done > 0 && working === null && notes?.configured ? (
                  regenerating === lang ? (
                    <div
                      role="alertdialog"
                      aria-label={t("adminNotesRegenerateConfirm")}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary p-3 text-sm"
                    >
                      <span>{t("adminNotesRegenerateConfirm")}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRegenerating(null)}
                        >
                          {t("askClearNo")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void prepare(lang, true)}
                        >
                          {t("adminNotesRegenerateYes")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setRegenerating(lang)}>
                      {t("adminNotesRegenerate")}
                    </Button>
                  )
                ) : null}
              </article>
            );
          })}
          {noteFailure ? (
            <p role="alert" className="text-sm text-destructive">
              {t("adminNotesFail", { error: noteFailure })}
            </p>
          ) : null}
          {sample.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("adminNotesSample")}</p>
              {sample.map((item) => (
                <article key={item.ref} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-medium">{item.ref}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {item.notes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
          {noteErrors.length ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                {t("adminNotesErrors")} · {noteErrors.length}
              </summary>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {noteErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
