import { cn } from "@/lib/utils";

/**
 * Grey lines the size of the text that is on its way, so the page does not
 * jump when it arrives. Screen readers hear the label instead.
 */
export function TextSkeleton({
  label,
  lines = 3,
  className,
  lineClassName = "h-4",
}: {
  label: string;
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div role="status" className={cn("flex flex-col gap-2.5", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "block animate-pulse rounded bg-secondary",
            lineClassName,
            index === lines - 1 ? "w-3/5" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
