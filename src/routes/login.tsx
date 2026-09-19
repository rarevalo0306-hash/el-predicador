import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/mark";
import { LanguageSwitch, useI18n } from "@/components/language-switch";
import { SignInPanel } from "@/components/sign-in-panel";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-8 px-5 py-10">
      <Logo />
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-3xl tracking-tight">{t("logIn")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("loginSub")}</p>
      </div>
      <LanguageSwitch />
      <SignInPanel collectDetails initialMode="entrar" />
      <Link
        to="/"
        className="h-11 text-sm text-muted-foreground hover:text-foreground"
      >
        {t("useWithoutAccount")}
      </Link>
      <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
          {t("privacyLink")}
        </Link>
        <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
          {t("termsLink")}
        </Link>
      </p>
    </main>
  );
}
