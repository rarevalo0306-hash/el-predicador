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

export function Logo({ className }: { className?: string }) {
  const locale = useAppStore((s) => s.locale) ?? "es";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PreacherMark className="size-12 shrink-0" />
      <div className="min-w-0">
        <p className="font-serif text-xl leading-none tracking-tight">
          The Preacher
        </p>
        <p className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {t(locale, "tagline")}
        </p>
      </div>
    </div>
  );
}
