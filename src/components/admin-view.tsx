import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import { getAdminOverview, type AdminOverview } from "@/lib/admin";
import { useAppStore } from "@/lib/store";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Pane = "registrations" | "accounts";

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
        {(["registrations", "accounts"] as const).map((id) => (
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
            {id === "registrations" ? t("adminRegistrations") : t("adminAccounts")}
            {data
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
    </section>
  );
}
