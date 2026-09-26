import { t } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PreacherMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg?v=5"
      alt=""
      width={160}
      height={160}
      className={cn("size-10 rounded-full object-cover", className)}
      crossOrigin="anonymous"
      aria-hidden
    />
  );
}

export function WordMark({ className }: { className?: string }) {
  return <PreacherMark className={className} />;
}

/**
 * The mark, with the name beside it from tablet width up. With `fit` (a bar
 * shared with buttons) the name shows only when it fits on one line, so a
 * crowded bar shows the mark alone instead of the name broken into pieces.
 */
export function Logo({ className, fit = false }: { className?: string; fit?: boolean }) {
  const locale = useAppStore((s) => s.locale) ?? "es";
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", fit && "flex-1", className)}>
      <PreacherMark className="size-10 shrink-0 sm:size-12" />
      <div className={cn("hidden min-w-0 sm:block", fit && "@container flex-1")}>
        <div className={fit ? "hidden @min-[6.5rem]:block" : undefined}>
          <p className="font-serif text-xl leading-none tracking-tight whitespace-nowrap">
            The Preacher
          </p>
          <p className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t(locale, "tagline")}
          </p>
        </div>
      </div>
      <span className="sr-only">The Preacher</span>
    </div>
  );
}
