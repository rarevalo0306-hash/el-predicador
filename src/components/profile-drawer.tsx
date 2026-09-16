import { UserButton, SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SignInPanel } from "@/components/sign-in-panel";
import { ContactForm } from "@/components/contact-form";
import { useI18n } from "@/components/language-switch";

type ProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const greeting = user?.displayName || user?.primaryEmail || "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{user ? t("profileTitle") : t("signupTitle")}</DrawerTitle>
          <DrawerDescription>
            {user ? t("profileHello", { name: greeting }) : t("profileDesc")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 px-5 pb-8">
          {isPending ? (
            <div className="h-36 animate-pulse rounded-xl bg-card" />
          ) : null}
          <SignedOut>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("profileGuest")}
            </p>
            <SignInPanel
              collectDetails
              onSuccess={() => onOpenChange(false)}
            />
          </SignedOut>
          <SignedIn>
            <div className="rounded-lg bg-secondary px-4 py-3">
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                {t("yourAccount")}
              </p>
              <div className="mt-3">
                <UserButton />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("accountKeeps")}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">{t("contactTitle")}</p>
              <ContactForm compact />
            </div>
          </SignedIn>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
