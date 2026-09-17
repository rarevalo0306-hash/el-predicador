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
    </main>
  );
}
