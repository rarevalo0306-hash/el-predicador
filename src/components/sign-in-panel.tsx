import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { submitContact } from "@/lib/contacts";

type SignInPanelProps = {
  collectDetails?: boolean;
  /** Default auth mode. Guests looking for sign-in should land on "entrar". */
  initialMode?: "entrar" | "crear";
  onSuccess?: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.6 3.7v3h4.2c2.4-2.2 3.9-5.5 3.9-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1 7.9-2.9l-4.2-3c-1.1.8-2.6 1.3-3.7 1.3-2.9 0-5.3-1.9-6.2-4.6H1.5v3.1C3.5 21.4 7.5 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.8 14.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.3H1.5C.7 8.8.2 10.4.2 12.6c0 2 .7 3.8 1.3 5.3l4.3-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.5l4.3 3.1C6.7 6.7 9.1 4.8 12 4.8z"
      />
    </svg>
  );
}

export function SignInPanel({
  collectDetails = false,
  initialMode = "entrar",
  onSuccess,
}: SignInPanelProps) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "crear">(initialMode);
  const [step, setStep] = useState<"correo" | "clave">("correo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creating = mode === "crear";
  const needDetails = collectDetails && creating;
  const showPassword = !creating || step === "clave";

  function goMode(next: "entrar" | "crear") {
    setMode(next);
    setStep("correo");
    setError(null);
  }

  function goNext(event: React.FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("contactBadEmail"));
      return;
    }
    setError(null);
    setStep("clave");
  }

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!authEnabled) return;
    if (creating && step === "correo") {
      goNext(event);
      return;
    }
    if (needDetails && !consent) {
      setError(t("contactNeedConsent"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (creating) {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
        });
        if (result.error) throw new Error(result.error.message);
        if (needDetails) {
          await submitContact({
            data: {
              name: name.trim() || email.trim(),
              email: email.trim(),
              phone,
              address,
              consent: true,
              locale,
              company: "",
              origin: "registro",
            },
          }).catch(() => undefined);
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) throw new Error(result.error.message);
      }
      onSuccess?.();
      await navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : t("signInError"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!authEnabled) {
    return <p className="text-sm text-muted-foreground">{t("authOff")}</p>;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={(event) => void handleEmail(event)}>
        <div className="grid gap-2">
          <Label htmlFor="profile-email">{t("emailAddress")}</Label>
          <Input
            id="profile-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="h-12 rounded-full px-5"
          />
        </div>
        {showPassword ? (
          <>
            {creating ? (
              <div className="grid gap-2">
                <Label htmlFor="profile-name">{t("name")}</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required={needDetails}
                  className="h-12 rounded-full px-5"
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="profile-password">{t("password")}</Label>
              <Input
                id="profile-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={creating ? "new-password" : "current-password"}
                className="h-12 rounded-full px-5"
              />
            </div>
            {needDetails ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="profile-phone">{t("contactPhone")}</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder={t("contactPhonePh")}
                    className="h-12 rounded-full px-5"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-address">{t("contactAddress")}</Label>
                  <Textarea
                    id="profile-address"
                    required
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    autoComplete="street-address"
                    placeholder={t("contactAddressPh")}
                  />
                </div>
                <label className="flex items-start gap-3 text-sm leading-snug text-foreground">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <span>{t("contactConsent")}</span>
                </label>
              </>
            ) : null}
          </>
        ) : null}
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={busy}>
          {busy ? t("wait") : creating ? t("signupLink") : t("logIn")}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-2">
        {GROK_PROVIDERS.filter((provider) => provider.idp === "google").map((provider) => (
          <Button
            key={provider.providerId}
            type="button"
            variant="outline"
            className="h-12 w-full rounded-full text-base"
            onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
          >
            {provider.idp === "google" ? <GoogleMark /> : null}
            {t("signupGoogle")}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {creating ? t("haveAccountAsk") : t("noAccountAsk")}{" "}
        <button
          type="button"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
          onClick={() => goMode(creating ? "entrar" : "crear")}
        >
          {creating ? t("logIn") : t("signupLink")}
        </button>
      </p>
    </div>
  );
}
