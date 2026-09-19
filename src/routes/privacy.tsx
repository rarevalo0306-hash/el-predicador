import { createFileRoute } from "@tanstack/react-router";
import { Contact, LegalPage, type LegalText } from "@/components/legal-page";
import { SITE } from "@/lib/legal/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy · ${SITE.name}` },
      {
        name: "description",
        content: `How ${SITE.name} handles your account, the people you add, and the messages you send.`,
      },
    ],
  }),
  component: Privacy,
});

const en: LegalText = {
  lang: "en",
  label: "English",
  title: "Privacy Policy",
  effective: `Effective ${SITE.effective}`,
  intro: (
    <p>
      {SITE.name} ({SITE.altName}) is a personal app for sending Bible verses, short words of
      encouragement and church invitations to people you know, by WhatsApp or SMS. This policy
      explains what we keep, why, and who can see it. The app is published at {SITE.url}. Questions
      go to <Contact />.
    </p>
  ),
  sections: [
    {
      heading: "What we collect",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Your account.</strong> Your e-mail address, your name, and a password. The
            password is stored only in hashed form.
          </li>
          <li>
            <strong>Your profile.</strong> A display name and, if you enter one, the name of your
            church.
          </li>
          <li>
            <strong>People you add.</strong> Their name, phone number, and which channel you chose
            for them (WhatsApp or SMS).
          </li>
          <li>
            <strong>Your reading.</strong> Saved verses, favorites, bookmarks, highlights, and the
            record of messages you have sent.
          </li>
          <li>
            <strong>Scheduled messages.</strong> The recipient's name and number, the message text,
            the days, time and time zone you chose, and your confirmation that the person agreed to
            receive it.
          </li>
          <li>
            <strong>Delivery receipts.</strong> For each scheduled send: whether the messaging
            provider accepted it, the provider's reference, and any error it reported.
          </li>
        </ul>
      ),
    },
    {
      heading: "Your phone's contacts",
      body: (
        <p>
          If you use "Import from phone", your browser shows you its own contact picker. Only the
          contacts you select there are read, and only their name and phone number. Nothing is
          uploaded until you save them. The app never reads your address book on its own.
        </p>
      ),
    },
    {
      heading: "Without an account",
      body: (
        <p>
          You can use the app without signing in. Then everything you save stays on your own device,
          in your browser's storage, and nothing is sent to us. Language, font size and reading
          preferences are always kept on the device.
        </p>
      ),
    },
    {
      heading: "How we use it",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>To run the app and keep your data the same on every device you sign in from.</li>
          <li>To send the messages you schedule, on the days and at the time you set.</li>
          <li>To show you whether each scheduled message went out.</li>
          <li>To answer you when you write to us.</li>
        </ul>
      ),
    },
    {
      heading: "What we do not do",
      body: (
        <p>
          We show no advertising, run no analytics or tracking, build no profiles, and never use the
          numbers you add for anything other than the messages you yourself send or schedule.
        </p>
      ),
    },
    {
      heading: "Who else sees your data",
      body: (
        <>
          <p>Only the services needed to run the app, and only for that purpose:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Twilio</strong> delivers SMS and WhatsApp messages. It receives the
              recipient's phone number and the message text for each send.
            </li>
            <li>
              <strong>Supabase</strong> hosts the database where account data is stored.
            </li>
            <li>
              <strong>Vercel</strong> hosts the app itself.
            </li>
          </ul>
          <p>
            <strong>
              We do not share, sell, or provide your mobile phone number or messaging consent data
              to third parties or affiliates for marketing or promotional purposes.
            </strong>{" "}
            All the categories above exclude text messaging originator opt-in data and consent; this
            information will not be shared with any third parties.
          </p>
          <p>
            We may disclose data when the law requires it, or to protect the safety of a person.
          </p>
        </>
      ),
    },
    {
      heading: "If you receive messages from this app",
      body: (
        <>
          <p>
            Messages are sent by someone you know, who confirmed that you agreed to receive them.
            Message frequency varies with what that person set up; a schedule sends at most one
            message per day. Message and data rates may apply.
          </p>
          <p>
            Reply <strong>STOP</strong> at any time to stop receiving messages from that number.
            Reply <strong>HELP</strong> for help, or write to <Contact />. Your number is used only
            to deliver those messages and is not shared for marketing.
          </p>
        </>
      ),
    },
    {
      heading: "How long we keep it",
      body: (
        <p>
          As long as your account exists. You can delete any person or schedule inside the app;
          deleting a schedule also deletes its delivery receipts. To delete your whole account,
          write to <Contact /> from the account's e-mail address and we will remove it.
        </p>
      ),
    },
    {
      heading: "Security",
      body: (
        <p>
          All traffic is encrypted in transit. Passwords are hashed. The credentials used to send
          messages live only on the server and never reach your browser.
        </p>
      ),
    },
    {
      heading: "Children",
      body: (
        <p>
          The app is not directed to children under 13, and we do not knowingly collect their data.
        </p>
      ),
    },
    {
      heading: "Changes",
      body: (
        <p>
          If this policy changes, the new version is published at this address with a new effective
          date.
        </p>
      ),
    },
  ],
};

const es: LegalText = {
  lang: "es",
  label: "Español",
  title: "Política de privacidad",
  effective: `Vigente desde el ${SITE.effective}`,
  intro: (
    <p>
      {SITE.name} ({SITE.altName}) es una app personal para enviar versículos de la Biblia, palabras
      de ánimo e invitaciones de la iglesia a personas que conoces, por WhatsApp o SMS. Esta
      política explica qué guardamos, para qué y quién puede verlo. La app se publica en {SITE.url}.
      Las preguntas van a <Contact />.
    </p>
  ),
  sections: [
    {
      heading: "Qué recopilamos",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Tu cuenta.</strong> Tu correo electrónico, tu nombre y una contraseña. La
            contraseña se guarda solo en forma cifrada (hash).
          </li>
          <li>
            <strong>Tu perfil.</strong> Un nombre para mostrar y, si lo escribes, el nombre de tu
            iglesia.
          </li>
          <li>
            <strong>Las personas que agregas.</strong> Su nombre, su teléfono y el canal que
            elegiste para cada una (WhatsApp o SMS).
          </li>
          <li>
            <strong>Tu lectura.</strong> Versículos guardados, favoritos, marcadores, subrayados y
            el registro de los mensajes que has enviado.
          </li>
          <li>
            <strong>Mensajes programados.</strong> El nombre y el número de la persona, el texto del
            mensaje, los días, la hora y la zona horaria que elegiste, y tu confirmación de que esa
            persona aceptó recibirlo.
          </li>
          <li>
            <strong>Comprobantes de envío.</strong> Por cada envío programado: si el proveedor de
            mensajería lo aceptó, su referencia y el error que haya reportado.
          </li>
        </ul>
      ),
    },
    {
      heading: "Los contactos de tu teléfono",
      body: (
        <p>
          Si usas "Importar del teléfono", tu navegador te muestra su propio selector de contactos.
          Solo se leen los contactos que tú marcas ahí, y de ellos solo el nombre y el teléfono. No
          se sube nada hasta que los guardas. La app nunca lee tu agenda por su cuenta.
        </p>
      ),
    },
    {
      heading: "Sin cuenta",
      body: (
        <p>
          Puedes usar la app sin iniciar sesión. En ese caso todo lo que guardas se queda en tu
          propio dispositivo, en el almacenamiento del navegador, y no se nos envía nada. El idioma,
          el tamaño de letra y las preferencias de lectura siempre se quedan en el dispositivo.
        </p>
      ),
    },
    {
      heading: "Para qué lo usamos",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Para que la app funcione y tus datos sean los mismos en cada dispositivo donde inicies
            sesión.
          </li>
          <li>Para enviar los mensajes que programas, los días y a la hora que fijaste.</li>
          <li>Para mostrarte si cada mensaje programado salió.</li>
          <li>Para responderte cuando nos escribes.</li>
        </ul>
      ),
    },
    {
      heading: "Lo que no hacemos",
      body: (
        <p>
          No mostramos publicidad, no usamos analítica ni rastreo, no armamos perfiles y nunca
          usamos los números que agregas para otra cosa que los mensajes que tú mismo envías o
          programas.
        </p>
      ),
    },
    {
      heading: "Quién más ve tus datos",
      body: (
        <>
          <p>Solo los servicios necesarios para que la app funcione, y solo para eso:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Twilio</strong> entrega los SMS y mensajes de WhatsApp. Recibe el teléfono de
              la persona y el texto del mensaje en cada envío.
            </li>
            <li>
              <strong>Supabase</strong> aloja la base de datos donde se guardan los datos de la
              cuenta.
            </li>
            <li>
              <strong>Vercel</strong> aloja la app.
            </li>
          </ul>
          <p>
            <strong>
              No compartimos, vendemos ni entregamos tu número de teléfono móvil ni tus datos de
              consentimiento de mensajería a terceros ni a afiliados con fines de marketing o
              promoción.
            </strong>{" "}
            Todas las categorías anteriores excluyen los datos de consentimiento (opt-in) de
            mensajería de texto; esa información no se comparte con ningún tercero.
          </p>
          <p>
            Podemos revelar datos cuando la ley lo exija o para proteger la seguridad de una
            persona.
          </p>
        </>
      ),
    },
    {
      heading: "Si recibes mensajes de esta app",
      body: (
        <>
          <p>
            Los mensajes los envía alguien que conoces, que confirmó que aceptaste recibirlos. La
            frecuencia depende de lo que esa persona programó; una programación envía como máximo un
            mensaje al día. Pueden aplicar tarifas de mensajes y datos.
          </p>
          <p>
            Responde <strong>STOP</strong> en cualquier momento para dejar de recibir mensajes de
            ese número. Responde <strong>HELP</strong> para ayuda, o escribe a <Contact />. Tu
            número se usa únicamente para entregar esos mensajes y no se comparte para marketing.
          </p>
        </>
      ),
    },
    {
      heading: "Cuánto tiempo lo guardamos",
      body: (
        <p>
          Mientras exista tu cuenta. Puedes eliminar cualquier persona o programación dentro de la
          app; al eliminar una programación se eliminan también sus comprobantes de envío. Para
          eliminar toda tu cuenta, escribe a <Contact /> desde el correo de la cuenta y la borramos.
        </p>
      ),
    },
    {
      heading: "Seguridad",
      body: (
        <p>
          Todo el tráfico va cifrado. Las contraseñas se guardan con hash. Las credenciales con las
          que se envían mensajes viven solo en el servidor y nunca llegan a tu navegador.
        </p>
      ),
    },
    {
      heading: "Menores",
      body: (
        <p>La app no está dirigida a menores de 13 años y no recopilamos sus datos a sabiendas.</p>
      ),
    },
    {
      heading: "Cambios",
      body: (
        <p>
          Si esta política cambia, la nueva versión se publica en esta misma dirección con una nueva
          fecha de vigencia.
        </p>
      ),
    },
  ],
};

function Privacy() {
  return (
    <LegalPage
      id="privacy"
      versions={[en, es]}
      other={{
        to: "/terms",
        labels: { en: "Messaging terms →", es: "Términos del servicio de mensajes →" },
      }}
    />
  );
}
