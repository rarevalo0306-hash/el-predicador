import { useState, useSyncExternalStore } from "react";
import { authClient, authEnabled, forgetDeletedSession } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/components/language-switch";
import { EMPTY_CLOUD, useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const subscribe = () => () => {};
const noGate = () => false;

export function DeleteAccountPanel() {
  const { locale } = useI18n();
  const es = locale === "es";
  const { user } = useCurrentUserState();
  const gate = useSyncExternalStore(subscribe, hasGateSessionMarker, noGate);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!authEnabled || !user || user.isDevFallback || gate) return null;
  return (
    <section
      className="border-t border-border pt-5"
      aria-label={es ? "Eliminar cuenta" : "Delete account"}
    >
      {!open ? (
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
          {es ? "Eliminar mi cuenta" : "Delete my account"}
        </Button>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirmed || busy) return;
            setBusy(true);
            setError(null);
            void (async () => {
              try {
                const result = await authClient.deleteUser({ ...(password ? { password } : {}) });
                if (result.error) {
                  const code = result.error.code ?? "";
                  if (/PASSWORD|CREDENTIAL/.test(code))
                    throw new Error(
                      es
                        ? "Comprueba tu contraseña. Si usas Google o Apple, deja el campo vacío e inicia sesión de nuevo antes de eliminar."
                        : "Check your password. For Google or Apple, leave it empty and sign in again before deleting.",
                    );
                  if (/SESSION|UNAUTHORIZED/.test(code))
                    throw new Error(
                      es
                        ? "Por seguridad, vuelve a iniciar sesión y repite la eliminación en los próximos cinco minutos."
                        : "For your security, sign in again and repeat deletion within five minutes.",
                    );
                  throw new Error(
                    es
                      ? "No se pudo eliminar la cuenta. Tus datos se conservan; vuelve a intentarlo."
                      : "Your account could not be deleted. Your data is preserved; please retry.",
                  );
                }
                // Do not let the previous owner's state become a guest on this device.
                useAppStore.getState().hydrateFromCloud(EMPTY_CLOUD);
                forgetDeletedSession();
                try {
                  window.sessionStorage.setItem("preacher-account-deleted", "1");
                } catch {
                  /* private mode */
                }
                window.location.replace("/");
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : es
                      ? "No se pudo eliminar."
                      : "Deletion failed.",
                );
                setBusy(false);
              }
            })();
          }}
        >
          <h3 className="text-base font-semibold">
            {es ? "Eliminar mi cuenta y sus datos" : "Delete my account and its data"}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {es
              ? "Se eliminarán tu cuenta, datos guardados en la nube, personas, programaciones y comprobantes de envío. Se cerrarán tus sesiones. Esta acción no se puede deshacer. Los mensajes ya entregados no se pueden retirar."
              : "Your account, cloud saves, people, schedules and delivery receipts will be deleted. Your sessions will end. This cannot be undone. Messages already delivered cannot be recalled."}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {es
              ? "Las lecturas sin cuenta guardadas solo en el iPhone se eliminan desde Mis lecturas. Para registros de contacto antiguos sin vínculo con la cuenta o copias enviadas a soporte, escribe a soporte desde el correo de la cuenta para que verifiquemos su retirada."
              : "Account-independent readings stored only on the iPhone are removed in My readings. For older unlinked contact registrations or copies sent to support, contact support from your account email so we can verify removal."}
          </p>
          <label className="grid gap-2 text-sm">
            {es ? "Contraseña (si entras con correo)" : "Password (if you sign in with email)"}
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
          </label>
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-primary"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={busy}
            />
            {es
              ? "Entiendo que la eliminación es definitiva y quiero continuar."
              : "I understand deletion is permanent and want to continue."}
          </label>
          {error ? (
            <p role="alert" className="text-sm leading-relaxed text-foreground">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirmed(false);
                setError(null);
              }}
            >
              {es ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" variant="destructive" disabled={!confirmed || busy}>
              {busy
                ? es
                  ? "Eliminando…"
                  : "Deleting…"
                : es
                  ? "Eliminar definitivamente"
                  : "Delete permanently"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
