import { ChevronRight, Flame, Heart, Settings, ShieldCheck } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { focusMoreButton } from "@/lib/panel-focus";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import type { MoreSection } from "@/lib/more-sections";

const ROW =
  "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/**
 * "Más": the sections that do not fit in the bottom bar (Doctrina,
 * Guardados, Admin for the team) and Ajustes, in one sheet.
 */
export function MoreSheet({
  open,
  onOpenChange,
  current,
  admin,
  onSection,
  onSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The section on screen, marked in the list. */
  current: string;
  /** Admin is listed only when the server says this account is staff. */
  admin: boolean;
  onSection: (section: MoreSection) => void;
  onSettings: () => void;
}) {
  const { t } = useI18n();
  const items: { id: MoreSection; icon: typeof Flame; label: string; hint: string }[] = [
    { id: "evangelio", icon: Flame, label: t("tabEvangelio"), hint: t("moreDoctrinaHint") },
    { id: "guardados", icon: Heart, label: t("tabGuardados"), hint: t("savedSub") },
    ...(admin
      ? [
          {
            id: "admin" as const,
            icon: ShieldCheck,
            label: t("tabAdmin"),
            hint: t("moreAdminHint"),
          },
        ]
      : []),
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent closeLabel={t("close")} onCloseAutoFocus={focusMoreButton}>
        <DrawerHeader className="pr-14">
          <DrawerTitle>{t("tabMore")}</DrawerTitle>
          <DrawerDescription>{t("moreDesc")}</DrawerDescription>
        </DrawerHeader>
        <nav
          aria-label={t("tabMore")}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = current === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSection(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(ROW, active && "bg-secondary")}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                        active && item.id === "guardados" && "fill-primary",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", active && "text-primary")}>
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mx-3 my-2 border-t border-border" role="presentation" />
          <button type="button" onClick={onSettings} aria-haspopup="dialog" className={ROW}>
            <Settings className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t("settingsTitle")}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {t("settingsDesc")}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
