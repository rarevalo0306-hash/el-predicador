import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/legal/site";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Ayuda y soporte · The Preacher" }] }),
  component: Support,
});

function Support() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-foreground">
      <h1 className="font-serif text-4xl">Ayuda y soporte · Support</h1>
      <section lang="es" className="mt-8 space-y-5 leading-relaxed">
        <h2 className="text-xl font-semibold">The Preacher · El Predicador</h2>
        <p>
          Para recibir ayuda, escribe a{" "}
          <a className="underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>
          . Describe el problema, tu modelo de dispositivo y la versión de la app. No envíes
          contraseñas ni datos privados de otras personas.
        </p>
        <h2 className="text-xl font-semibold">Cuenta y privacidad</h2>
        <p>
          Puedes eliminar tu cuenta desde Perfil → Eliminar mi cuenta. Por seguridad, confirma tu
          contraseña o inicia sesión de nuevo antes de eliminarla. Para registros antiguos de
          contacto sin vínculo a una cuenta o copias enviadas al correo de soporte, escríbenos desde
          el correo de la cuenta para verificar y tramitar su retirada.
        </p>
        <h2 className="text-xl font-semibold">Lecturas sin conexión</h2>
        <p>
          En iPhone, el botón con libros de la barra superior abre Mis lecturas. Estos textos se
          guardan solo en el dispositivo y se eliminan desde esa biblioteca. La sección principal de
          Predicador necesita internet.
        </p>
      </section>
      <section lang="en" className="mt-10 space-y-5 border-t border-border pt-8 leading-relaxed">
        <h2 className="text-xl font-semibold">Help in English</h2>
        <p>
          Contact{" "}
          <a className="underline" href={`mailto:${SITE.contactEmail}`}>
            {SITE.contactEmail}
          </a>{" "}
          with a description of the issue, your device model and app version. Never send passwords
          or other people's private information.
        </p>
        <p>
          To delete your account, open Profile → Delete my account. Confirm your password or sign in
          again before deleting. Contact support from your account email for older unlinked
          registrations or copies previously forwarded to support.
        </p>
        <p>
          On iPhone, the books button in the top bar opens My readings. These texts are stored on
          your device and can be removed there. The main Preacher section needs an internet
          connection.
        </p>
      </section>
      <nav className="mt-10 flex flex-wrap gap-6 text-sm" aria-label="Legal">
        <a href="/privacy" className="underline">
          Privacidad / Privacy
        </a>
        <a href="/terms" className="underline">
          Términos / Terms
        </a>
        <a href="/" className="underline">
          Volver / Back
        </a>
      </nav>
    </main>
  );
}
