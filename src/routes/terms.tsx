import { createFileRoute } from "@tanstack/react-router";
import { Contact, LegalPage, type LegalText } from "@/components/legal-page";
import { SITE } from "@/lib/legal/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Messaging Terms · ${SITE.name}` },
      {
        name: "description",
        content: `Terms of the ${SITE.name} message program: consent, frequency, STOP and HELP.`,
      },
    ],
  }),
  component: Terms,
});

const en: LegalText = {
  lang: "en",
  label: "English",
  title: "Messaging Terms and Conditions",
  effective: `Effective ${SITE.effective}`,
  intro: (
    <p>
      These terms cover the <strong>{SITE.name} verse messages</strong> program: Bible verses and
      short words of encouragement that a user of {SITE.name} ({SITE.altName}) sends to people they
      know, by SMS or WhatsApp, either right away or on a schedule they set. The program is operated
      from {SITE.url}. Questions go to <Contact />.
    </p>
  ),
  sections: [
    {
      heading: "Consent",
      body: (
        <>
          <p>
            Messages go only to people who have agreed to receive them. The person using the app
            obtains that agreement directly — in person, by voice, or in writing — from someone they
            know, and confirms it in the app before automatic sending can be turned on. The app
            refuses to activate a schedule without that confirmation.
          </p>
          <p>
            Agreeing to receive messages is never a condition of buying anything, and no purchase is
            involved.
          </p>
        </>
      ),
    },
    {
      heading: "What you will receive",
      body: (
        <p>
          A Bible verse or a short message of encouragement, chosen by the person who added you.
          Message frequency varies with what that person set up; a schedule sends at most one
          message per day. <strong>Message and data rates may apply.</strong>
        </p>
      ),
    },
    {
      heading: "How to stop",
      body: (
        <p>
          Reply <strong>STOP</strong> to any message to cancel. You will get one confirmation and
          then no further messages from that number. Reply <strong>START</strong> if you later want
          them again. You can also ask the person who sends them, or write to <Contact />.
        </p>
      ),
    },
    {
      heading: "Help",
      body: (
        <p>
          Reply <strong>HELP</strong> to any message, or write to <Contact />.
        </p>
      ),
    },
    {
      heading: "For senders",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>Add only people who have told you they want these messages.</li>
          <li>Stop at once if someone asks you to, in any form.</li>
          <li>
            Use the program for Bible verses and encouragement only — no advertising, no
            solicitation, nothing unlawful.
          </li>
          <li>Keep your account to yourself; you are responsible for what is sent from it.</li>
        </ul>
      ),
    },
    {
      heading: "Delivery",
      body: (
        <p>
          Carriers are not liable for delayed or undelivered messages. Delivery depends on the
          recipient's carrier and device and is not guaranteed. The program is not for emergencies.
        </p>
      ),
    },
    {
      heading: "Privacy",
      body: (
        <p>
          How numbers and messages are handled is described in the privacy policy linked below.
          Mobile numbers and consent data are not shared with third parties or affiliates for
          marketing or promotional purposes.
        </p>
      ),
    },
    {
      heading: "Changes",
      body: (
        <p>
          If these terms change, the new version is published at this address with a new effective
          date.
        </p>
      ),
    },
  ],
};

const es: LegalText = {
  lang: "es",
  label: "Español",
  title: "Términos y condiciones del servicio de mensajes",
  effective: `Vigente desde el ${SITE.effective}`,
  intro: (
    <p>
      Estos términos cubren el programa <strong>mensajes con versículos de {SITE.name}</strong>:
      versículos de la Biblia y palabras de ánimo que un usuario de {SITE.name} ({SITE.altName})
      envía a personas que conoce, por SMS o WhatsApp, en el momento o en un horario que él mismo
      fija. El programa se opera desde {SITE.url}. Las preguntas van a <Contact />.
    </p>
  ),
  sections: [
    {
      heading: "Consentimiento",
      body: (
        <>
          <p>
            Los mensajes solo llegan a personas que aceptaron recibirlos. Quien usa la app obtiene
            esa aceptación directamente — en persona, de palabra o por escrito — de alguien que
            conoce, y la confirma en la app antes de poder activar el envío automático. La app se
            niega a activar una programación sin esa confirmación.
          </p>
          <p>
            Aceptar los mensajes nunca es condición para comprar nada, y no hay ninguna compra de
            por medio.
          </p>
        </>
      ),
    },
    {
      heading: "Qué vas a recibir",
      body: (
        <p>
          Un versículo de la Biblia o un mensaje corto de ánimo, elegido por la persona que te
          agregó. La frecuencia depende de lo que esa persona programó; una programación envía como
          máximo un mensaje al día.{" "}
          <strong>Pueden aplicar tarifas de mensajes y datos de tu operador.</strong>
        </p>
      ),
    },
    {
      heading: "Cómo dejar de recibirlos",
      body: (
        <p>
          Responde <strong>STOP</strong> a cualquier mensaje para cancelar. Recibirás una sola
          confirmación y después ningún mensaje más de ese número. Responde <strong>START</strong>{" "}
          si más adelante los quieres de nuevo. También puedes pedírselo a la persona que los envía
          o escribir a <Contact />.
        </p>
      ),
    },
    {
      heading: "Ayuda",
      body: (
        <p>
          Responde <strong>HELP</strong> a cualquier mensaje, o escribe a <Contact />.
        </p>
      ),
    },
    {
      heading: "Para quien envía",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>Agrega solo a personas que te dijeron que quieren estos mensajes.</li>
          <li>Detente de inmediato si alguien te lo pide, de cualquier forma.</li>
          <li>
            Usa el programa solo para versículos y ánimo — nada de publicidad, ventas ni contenido
            ilegal.
          </li>
          <li>No prestes tu cuenta; eres responsable de lo que se envíe desde ella.</li>
        </ul>
      ),
    },
    {
      heading: "Entrega",
      body: (
        <p>
          Los operadores no son responsables por mensajes demorados o no entregados. La entrega
          depende del operador y del dispositivo de la persona y no está garantizada. El programa no
          es para emergencias.
        </p>
      ),
    },
    {
      heading: "Privacidad",
      body: (
        <p>
          Cómo se manejan los números y los mensajes está descrito en la política de privacidad
          enlazada abajo. Los números de teléfono móvil y los datos de consentimiento no se
          comparten con terceros ni afiliados con fines de marketing o promoción.
        </p>
      ),
    },
    {
      heading: "Cambios",
      body: (
        <p>
          Si estos términos cambian, la nueva versión se publica en esta misma dirección con una
          nueva fecha de vigencia.
        </p>
      ),
    },
  ],
};

function Terms() {
  return (
    <LegalPage
      id="terms"
      versions={[en, es]}
      other={{ to: "/privacy", labels: { en: "Privacy policy →", es: "Política de privacidad →" } }}
    />
  );
}
