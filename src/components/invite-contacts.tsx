import { useEffect, useState } from "react";
import { Copy, MessageCircle, MessageSquareText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-switch";
import { copyText, openSms, openWhatsApp, tryNativeShare } from "@/lib/share";

export const APP_URL = "https://www.thepreacher.app";

/** Added to the address when Google brings back a brand-new account. */
export const WELCOME_PARAM = "bienvenido";

/**
 * "Share the app with your contacts", offered right after someone creates
 * an account. The person picks who gets it in WhatsApp, Messages or the
 * phone's share sheet; the app itself never reads their contacts or sends
 * anything on its own.
 */
export function InviteContacts({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [canShare, setCanShare] = useState(false);
  const [shared, setShared] = useState(false);
  const message = `${t("shareAppText")}\n${APP_URL}`;

  // Settled after mount: the server has no navigator.
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function copy() {
    try {
      await copyText(message);
      setShared(true);
      toast(t("shareAppCopied"));
    } catch {
      toast(t("shareAppFail"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
        {message}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          onClick={() => {
            setShared(true);
            openWhatsApp(message);
          }}
        >
          <MessageCircle />
          WhatsApp
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => {
            setShared(true);
            openSms(message);
          }}
        >
          <MessageSquareText />
          {t("inviteSms")}
        </Button>
        {canShare ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => {
              setShared(true);
              void tryNativeShare("The Preacher", message);
            }}
          >
            <Share2 />
            {t("inviteMore")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="outline"
          className={canShare ? undefined : "col-span-2"}
          onClick={() => void copy()}
        >
          <Copy />
          {t("inviteCopy")}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("inviteHint")}</p>
      <Button type="button" variant={shared ? "default" : "ghost"} onClick={onDone}>
        {shared ? t("inviteDone") : t("inviteLater")}
      </Button>
    </div>
  );
}
