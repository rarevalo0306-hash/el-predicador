import { UserButton, SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { focusProfileButton } from "@/lib/panel-focus";
import { SignInPanel } from "@/components/sign-in-panel";
import { ContactForm } from "@/components/contact-form";
import { useI18n } from "@/components/language-switch";
import { InviteContacts } from "@/components/invite-contacts";
import { useEffect, useState } from "react";


const BODY = "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]";

type ProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "entrar" | "crear";
  /** Open straight on "share the app", for an account just created elsewhere. */
  welcome?: boolean;
  /** Where focus goes on close; by default Perfil (or Entrar) in the header. */
  onCloseAutoFocus?: (event: Event) => void;
};

export function ProfileDrawer({
  open,
  onOpenChange,
  initialMode = "entrar",
  welcome = false,
  onCloseAutoFocus = focusProfileButton,
}: ProfileDrawerProps) {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const greeting = user?.displayName || user?.primaryEmail || "";
  const guestTitle = initialMode === "crear" ? t("signupTitle") : t("logIn");
  const guestDesc = initialMode === "crear" ? t("profileDesc") : t("loginSub");
  // Right after a new account, the drawer offers to share the app before closing.
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    if (!open) setJustJoined(false);
    else if (welcome) setJustJoined(true);
  }, [open, welcome]);

  if (justJoined && user) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent closeLabel={t("close")} onCloseAutoFocus={onCloseAutoFocus}>
          <DrawerHeader className="pr-14">
            <DrawerTitle>{t("inviteTitle")}</DrawerTitle>
            <DrawerDescription>{t("inviteDesc")}</DrawerDescription>
          </DrawerHeader>
          <div className={BODY}>
            <InviteContacts onDone={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent closeLabel={t("close")} onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHeader className="pr-14">
          <DrawerTitle>{user ? t("profileTitle") : guestTitle}</DrawerTitle>
          <DrawerDescription>
            {user ? t("profileHello", { name: greeting }) : guestDesc}
          </DrawerDescription>
        </DrawerHeader>
        <div className={`${BODY} flex flex-col gap-5`}>
          {isPending ? (
            <div className="h-36 animate-pulse rounded-xl bg-card" />
          ) : null}
          <SignedOut>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("profileGuest")}
            </p>
            <SignInPanel
              key={initialMode}
              collectDetails
              initialMode={initialMode}
              onSuccess={({ created }) => (created ? setJustJoined(true) : onOpenChange(false))}
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
