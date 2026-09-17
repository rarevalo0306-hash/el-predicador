import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { normalizePhone } from "@/lib/phone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { submitContact } from "@/lib/contacts";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useAppStore } from "@/lib/store";

type ContactFormProps = {
  compact?: boolean;
};

export function ContactForm({ compact }: ContactFormProps) {
  const { locale, t } = useI18n();
  const user = useCurrentUser();
  const displayName = useAppStore((s) => s.displayName);
  const [name, setName] = useState(displayName || user?.displayName || "");
  const [email, setEmail] = useState(user?.primaryEmail || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      toast.error(t("contactNeedConsent"));
      return;
    }
    if (!normalizePhone(phone)) {
      toast.error(t("contactBadPhone"));
      return;
    }
    setBusy(true);
    try {
      const result = await submitContact({
        data: {
          name,
          email,
          phone,
          address,
          consent,
          locale,
          company,
          origin: compact ? "ajustes" : "hoy",
        },
      });
      toast.success(result.duplicate ? t("contactUpdated") : t("contactSaved"));
      try {
        localStorage.setItem("preacher-contacted", "1");
      } catch {
        /* private mode */
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "email") toast.error(t("contactBadEmail"));
      else if (code === "phone") toast.error(t("contactBadPhone"));
      else if (code === "address" || code === "name") toast.error(t("contactBadFields"));
      else toast.error(t("contactFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
      {compact ? null : (
        <p className="text-sm leading-relaxed text-muted-foreground">{t("contactLead")}</p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="contact-name">{t("contactName")}</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-email">{t("contactEmail")}</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-phone">{t("contactPhone")}</Label>
        <PhoneInput id="contact-phone" value={phone} onChange={setPhone} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-address">{t("contactAddress")}</Label>
        <Textarea
          id="contact-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          autoComplete="street-address"
          placeholder={t("contactAddressPh")}
          required
        />
      </div>
      <label className="sr-only" htmlFor="contact-company">
        {t("contactCompany")}
      </label>
      <input
        id="contact-company"
        tabIndex={-1}
        autoComplete="off"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      />
      <label className="flex items-start gap-3 text-sm leading-snug text-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-primary"
        />
        <span>{t("contactConsent")}</span>
      </label>
      <Button type="submit" className="h-12 w-full" disabled={busy}>
        {busy ? t("wait") : t("contactSubmit")}
      </Button>
    </form>
  );
}
