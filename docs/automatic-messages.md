# Envíos automáticos

La sección **Gente → Programar envíos** permite guardar por cuenta un destinatario, mensaje fijo, idioma (español o inglés), canal (WhatsApp o SMS), días de la semana, hora con minutos y zona horaria. Desde **Enviar este verso → Programar este mensaje** se copia el texto del mensaje al formulario.

Guardar crea una programación **en pausa**. Activarla requiere conexión de mensajería, acceso autorizado y la confirmación de que el destinatario aceptó recibir los mensajes. Editar una programación la vuelve a pausar. Activar calcula la siguiente fecha futura, sin recuperar mensajes pasados.

## Conexión en Vercel (Production)

Configurar los secretos directamente en Vercel, nunca en el chat ni en Git:

- `CRON_SECRET`: secreto aleatorio de al menos 32 caracteres. Vercel lo envía como Bearer en cada ejecución.
- `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`: credenciales de la cuenta Twilio del propietario.
- `TWILIO_SMS_FROM`: número SMS habilitado en Twilio, en formato `+…`, si se usará SMS.
- `TWILIO_WHATSAPP_FROM`: remitente WhatsApp Business aprobado, en formato `+…`, si se usará WhatsApp.
- `TWILIO_WHATSAPP_CONTENT_SID_ES` y `TWILIO_WHATSAPP_CONTENT_SID_EN`: una plantilla aprobada por idioma. `TWILIO_WHATSAPP_CONTENT_SID` se conserva como alternativa para español en configuraciones anteriores; inglés nunca usa esa alternativa. Cada una es una plantilla de Twilio aprobada por WhatsApp. El contrato de variables es `1 = nombre del destinatario`, `2 = texto del mensaje`. Usar una plantilla aprobada que permita ese contenido, idioma y finalidad. El texto variable elimina saltos y espacios repetidos. El mensaje fijo y la vista previa deben corresponder a esa plantilla.
- `MESSAGING_ALLOWED_USER_IDS`: IDs de usuarios Better Auth autorizados, separados por comas. Obtenerlos en la tabla `user` tras iniciar sesión. Una cuenta cualquiera no obtiene acceso al remitente del propietario.
- `MESSAGING_ENABLED=true`: habilita el procesamiento. Omitirlo mantiene desactivados todos los envíos.

Hacer Redeploy después de configurar. El proyecto usa un cron cada minuto: `/api/cron/messages`. Requiere un plan de Vercel que admita esa frecuencia (el proyecto existente es Pro). Sin `CRON_SECRET` el endpoint devuelve 401. Las credenciales de Google no sirven como credenciales de mensajería.

Conectar el servicio no activa por sí solo las programaciones guardadas: su propietario debe pulsar **Activar envío automático**. Los costes de mensajes dependen del proveedor y del país; no se contrata ni compra un servicio desde esta implementación. Configurar las bajas/opt-out del remitente en el proveedor y pausar los horarios afectados.

## Comportamiento y límites

- Hasta 20 programaciones por cuenta, un destinatario y un mensaje fijo de hasta 1.000 caracteres por programación.
- Se procesan hasta 10 vencidas por ejecución. No es una garantía de envío al segundo exacto.
- Se respetan las zonas IANA y el horario de verano. En el salto de primavera, una hora inexistente se desplaza hacia adelante; en la repetición de otoño se usa una sola vez la primera ocurrencia.
- Un retraso mayor de 15 minutos marca ese envío como omitido y calcula el siguiente. No se envían lotes acumulados tras una interrupción.
- Una reserva temporal y un registro único por programación/fecha evitan duplicados entre ejecuciones concurrentes.
- Ante un resultado incierto, no se repite automáticamente: revisar el proveedor. Se prefiere un envío omitido a enviar duplicados.
- “Aceptado por el servicio” confirma recepción por Twilio, **no entrega ni lectura**. Consultar Twilio para el estado final. No se implementa una confirmación de entrega mediante webhook.
- No se envían desde WhatsApp personal, enlaces `wa.me` ni automatizando un navegador. Fuera de la ventana de atención de WhatsApp se requiere plantilla aprobada.
- Guardar o editar no envía mensajes. La comprobación de código usa proveedores simulados y números de ejemplo; no se envían mensajes de prueba reales.

## Verificación

`npm run test:schedules` cubre zonas horarias, DST, validación, aislamiento por usuario, persistencia SQL, concurrencia, estados inciertos y rechazo de llamadas cron sin autorización. `npm run typecheck` y `npm run build` verifican la integración.

Referencias: [Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp/key-concepts), [Twilio Messages](https://www.twilio.com/docs/messaging/api/message-resource).

## Idioma y temas

El idioma de envío se guarda por contacto y por programación, independientemente del idioma de la app. En el formulario de programación se puede escoger un tema y versículo; cambiar el idioma vuelve a cargar ese versículo en el idioma elegido. El texto guardado es el texto exacto que procesará el servicio. Editarlo manualmente lo convierte en texto personalizado, que no se traduce automáticamente. Las notas personales también conservan su texto.

Temas adicionales: Jóvenes, Matrimonios, Amistad y Oración. Los textos bíblicos se cargan con el lector existente; no se presentan traducciones generadas como citas bíblicas. Las programaciones anteriores conservan sus mensajes y usan español como idioma predeterminado.
