import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { WELCOME_PARAM } from "@/components/invite-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { normalizePhone } from "@/lib/phone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-switch";
import { submitContact } from "@/lib/contacts";

type SignInPanelProps = {
  collectDetails?: boolean;
  /** Default auth mode. Guests looking for sign-in should land on "entrar". */
  initialMode?: "entrar" | "crear";
  /** `created` is true when this was a new account rather than a sign-in. */
  onSuccess?: (result: { created: boolean }) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Apple mark geometry: simple-icons/simple-icons, icons/apple.svg (CC0).
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

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
  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth-status", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setAppleAvailable(data.apple === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
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
  // A second Enter before the button turns off must not create the account
  // (and its registration) twice.
  const submitting = useRef(false);
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
    if (needDetails && !normalizePhone(phone)) {
      setError(t("contactBadPhone"));
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
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
      onSuccess?.({ created: creating });
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("signInError"));
    } finally {
      submitting.current = false;
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
                  <PhoneInput id="profile-phone" value={phone} onChange={setPhone} required />
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
        {error ? (
          <p className="text-sm leading-relaxed text-primary" role="alert">
            {error}
          </p>
        ) : null}
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
        {[
          ...GROK_PROVIDERS.filter((provider) => provider.idp === "google"),
          ...(appleAvailable ? [{ providerId: "apple", idp: "apple", label: "Apple" }] : []),
        ].map((provider) => (
          <Button
            key={provider.providerId}
            type="button"
            variant="outline"
            className={
              provider.idp === "apple"
                ? "h-12 w-full rounded-full bg-foreground text-base text-background hover:bg-foreground/90 hover:text-background"
                : "h-12 w-full rounded-full text-base"
            }
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                try {
                  await signIn(provider.providerId, {
                    callbackURL: "/",
                    newUserCallbackURL: `/?${WELCOME_PARAM}=1`,
                  });
                } catch (err) {
                  const message =
                    err instanceof Error && err.message ? err.message : t("signInError");
                  const friendly =
                    message === "GOOGLE_NOT_CONFIGURED" ||
                    /provider not found|GOOGLE_NOT_CONFIGURED/i.test(message)
                      ? t("googleNotConfigured")
                      : message;
                  setError(friendly);
                  toast.error(friendly);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {provider.idp === "google" ? <GoogleMark /> : <AppleMark />}
            {provider.idp === "apple"
              ? locale === "es"
                ? "Continuar con Apple"
                : "Continue with Apple"
              : t("signupGoogle")}
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
