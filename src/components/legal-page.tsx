import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/mark";
import { SITE } from "@/lib/legal/site";

/**
 * A legal page carries both languages on one screen, English first. The
 * messaging provider reviews these pages from outside the app, sometimes by
 * machine, so what it needs must be in the served HTML, not behind the
 * in-app language switch.
 */
export type LegalSection = { heading: string; body: ReactNode };
export type LegalText = {
  lang: "en" | "es";
  label: string;
  title: string;
  effective: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export function LegalPage({
  id,
  versions,
  other,
}: {
  id: "privacy" | "terms";
  versions: LegalText[];
  other: { to: "/privacy" | "/terms"; labels: Record<"en" | "es", string> };
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-16">
      <header className="flex flex-col items-start gap-6">
        <Link to="/" aria-label={SITE.name}>
          <Logo />
        </Link>
        <nav aria-label="Language" className="flex flex-wrap gap-2 text-sm">
          {versions.map((v) => (
            <a
              key={v.lang}
              href={`#${id}-${v.lang}`}
              className="rounded-full border border-border bg-card px-4 py-2 hover:text-foreground"
            >
              {v.label}
            </a>
          ))}
        </nav>
      </header>
      {versions.map((v) => (
        <article
          key={v.lang}
          id={`${id}-${v.lang}`}
          lang={v.lang}
          className="mt-12 scroll-mt-6 space-y-8 border-t border-border pt-10 first-of-type:border-t-0 first-of-type:pt-0"
        >
          <div>
            <h1 className="font-serif text-3xl tracking-tight">{v.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{v.effective}</p>
          </div>
          <div className="text-[15px] leading-relaxed">{v.intro}</div>
          {v.sections.map((s) => (
            <section key={s.heading} className="space-y-3 text-[15px] leading-relaxed">
              <h2 className="font-serif text-xl">{s.heading}</h2>
              {s.body}
            </section>
          ))}
          <p className="text-sm">
            <Link to={other.to} className="underline underline-offset-4">
              {other.labels[v.lang]}
            </Link>
          </p>
        </article>
      ))}
    </main>
  );
}

export function Contact() {
  return (
    <a href={`mailto:${SITE.contactEmail}`} className="underline underline-offset-4">
      {SITE.contactEmail}
    </a>
  );
}
