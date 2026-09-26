import type { Dispatch, SetStateAction } from "react";
import { Check, ContactRound, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import { MessageLanguageSelect } from "@/components/message-language-select";
import { useI18n } from "@/components/language-switch";
import { cn } from "@/lib/utils";
import { THEMES, localizedTheme } from "@/lib/verses";
import { toggleTheme } from "@/lib/recipient-themes";
import type { RecipientInput } from "@/lib/store";

const FORM_ID = "person-form";

/**
 * "Nueva persona" and "Editar", in their own panel so the list of contacts
 * comes first on the page. Closing the panel keeps what was typed, so a
 * swipe by mistake loses nothing; saving clears it.
 */
export function PersonFormDrawer({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSave,
  canPickContacts,
  importing,
  onImport,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: RecipientInput;
  setForm: Dispatch<SetStateAction<RecipientInput>>;
  onSave: () => void;
  canPickContacts: boolean;
  importing: boolean;
  onImport: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent closeLabel={t("close")} onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHeader className="pr-14">
          <DrawerTitle>{editing ? t("personEditTitle") : t("personAdd")}</DrawerTitle>
          <DrawerDescription>{t("personAddDesc")}</DrawerDescription>
        </DrawerHeader>
        <form
          id={FORM_ID}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-1 pb-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          {canPickContacts && !editing ? (
            <div className="grid gap-1.5">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                disabled={importing}
                onClick={onImport}
              >
                <ContactRound className="size-4" />
                {importing ? t("wait") : t("personFromPhone")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("personFromPhoneHint")}</p>
            </div>
          ) : null}
          <div className="grid items-start gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">{t("recipientName")}</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("recipientNamePh")}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-phone">{t("contactPhone")}</Label>
              <PhoneInput
                id="p-phone"
                value={form.phone}
                onChange={(phone) => setForm((f) => ({ ...f, phone }))}
              />
            </div>
          </div>
          <MessageLanguageSelect
            value={form.messageLocale ?? locale}
            onChange={(messageLocale) => setForm((f) => ({ ...f, messageLocale }))}
          />
          <div className="grid gap-1.5">
            <Label>{t("personChannel")}</Label>
            <div className="flex gap-2">
              {(["whatsapp", "sms"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={(form.channel ?? "whatsapp") === option}
                  onClick={() => setForm((f) => ({ ...f, channel: option }))}
                  className={cn(
                    "h-11 flex-1 rounded-md border text-sm font-medium",
                    (form.channel ?? "whatsapp") === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {option === "sms" ? t("personChannelSms") : t("personChannelWhatsApp")}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("personChannelHint")}</p>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("personTheme")}</Label>
            <p className="text-xs text-muted-foreground">{t("personThemeHint")}</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => {
                const label = localizedTheme(theme.id, locale).name;
                const chosen = form.themeIds ?? ["amor"];
                const on = chosen.includes(theme.id);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        themeIds: toggleTheme(f.themeIds ?? ["amor"], theme.id),
                      }))
                    }
                    className={cn(
                      "inline-flex h-9 items-center gap-1 rounded-full border px-3 text-sm font-medium",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {on ? <Check className="size-3.5" /> : null}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-notes">{t("personNotes")}</Label>
            <Textarea
              id="p-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={t("personNotesPh")}
              className="min-h-16"
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
            <span>
              <span className="block font-medium">{t("personDaily")}</span>
              <span className="text-xs text-muted-foreground">{t("personDailyHint")}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(form.dailyEnabled)}
              onChange={(e) => setForm((f) => ({ ...f, dailyEnabled: e.target.checked }))}
              className="size-5 accent-[var(--color-primary)]"
            />
          </label>
          {form.dailyEnabled ? (
            <div className="grid gap-1.5">
              <Label htmlFor="p-hour">{t("personDailyHour")}</Label>
              <Input
                id="p-hour"
                type="number"
                min={0}
                max={23}
                value={form.dailyHour ?? 9}
                onChange={(e) => setForm((f) => ({ ...f, dailyHour: Number(e.target.value) }))}
              />
            </div>
          ) : null}
          <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
            <span>
              <span className="block font-medium">{t("personCulto")}</span>
              <span className="text-xs text-muted-foreground">{t("personCultoHint")}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(form.cultoEnabled)}
              onChange={(e) => setForm((f) => ({ ...f, cultoEnabled: e.target.checked }))}
              className="size-5 accent-[var(--color-primary)]"
            />
          </label>
        </form>
        {/* Outside the scrolling form, so Guardar is always in reach. */}
        <div className="border-t border-border px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button type="submit" form={FORM_ID} className="w-full">
            <Plus className="size-4" />
            {editing ? t("personUpdate") : t("personSave")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
