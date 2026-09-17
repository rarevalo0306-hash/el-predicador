import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/language-switch";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { listContacts, type Contact } from "@/lib/contacts";
import { REGISTRATION_SHEET_URL } from "@/lib/sheet";

function toCsv(rows: Contact[]) {
  const header = ["fecha", "nombre", "email", "telefono", "direccion", "idioma"];
  const lines = rows.map((row) =>
    [row.createdAt, row.name, row.email, row.phone, row.address, row.locale]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function PeoplePanel() {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [rows, setRows] = useState<Contact[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await listContacts({ data: { pin } });
      if (!result.ok) {
        setRows(null);
        toast.error(result.error === "unavailable" ? t("peopleUnavailable") : t("peopleBadPin"));
        return;
      }
      setRows(result.rows);
    } catch {
      setRows(null);
      toast.error(t("peopleBadPin"));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!rows?.length) return;
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "el-predicador-personas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <SignedOut>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("peopleNeedSignIn")}</p>
      </SignedOut>
      <SignedIn>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("peopleLead")}</p>
        <Button asChild variant="outline" className="h-11 w-full">
          <a href={REGISTRATION_SHEET_URL} target="_blank" rel="noreferrer">
            <FileSpreadsheet className="size-4" />
            {t("sheetsOpen")}
          </a>
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("sheetsHint")}</p>
        <form className="flex flex-col gap-3" onSubmit={(event) => void load(event)}>
          <div className="grid gap-2">
            <Label htmlFor="people-pin">{t("peoplePin")}</Label>
            <Input
              id="people-pin"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="outline" className="h-11 w-full" disabled={busy}>
            {busy ? t("wait") : t("peopleOpen")}
          </Button>
        </form>
        {rows ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{t("peopleCount", { n: rows.length })}</p>
              {rows.length ? (
                <Button type="button" variant="ghost" size="sm" onClick={download}>
                  <Download className="size-4" />
                  {t("peopleCsv")}
                </Button>
              ) : null}
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("peopleEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rows.map((row) => {
                  const digits = row.phone.replace(/\D/g, "");
                  return (
                    <li
                      key={row.id}
                      className="rounded-lg border border-border bg-card px-3 py-3 text-sm"
                    >
                      <p className="font-medium">{row.name}</p>
                      <p className="mt-1 text-muted-foreground">{row.email}</p>
                      <p className="text-muted-foreground">
                        {row.phone || t("peopleNoPhone")}
                      </p>
                      <p className="mt-1 text-muted-foreground">{row.address}</p>
                      {digits.length >= 7 ? (
                        <div className="mt-3 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <a
                              href={`https://wa.me/${digits}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("peopleWhatsApp")}
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <a href={`sms:${digits}`}>
                              {t("peopleSms")}
                            </a>
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </SignedIn>
    </div>
  );
}
