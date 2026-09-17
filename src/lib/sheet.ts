export const REGISTRATION_SHEET_ID =
  "1rym4KeN2WYbAPb0B7SkZId2IaclZYVqASeUzZ3Yk2Io";

export const REGISTRATION_SHEET_URL = `https://docs.google.com/spreadsheets/d/${REGISTRATION_SHEET_ID}/edit`;

export type RegistrationRow = {
  name: string;
  email: string;
  phone: string;
  address: string;
  locale: string;
  origin?: string;
};

/**
 * Best-effort inbox copy. Destination comes only from CONTACTS_EMAIL —
 * never hardcode an address in the repo.
 */
export async function forwardRegistration(row: RegistrationRow) {
  const inbox = process.env.CONTACTS_EMAIL?.trim();
  if (!inbox) return;

  const stamped = {
    ...row,
    fecha: new Date().toISOString(),
    origen: row.origin || "app",
    _subject: "El Predicador — nuevo registro",
    _template: "table",
    _captcha: "true",
  };
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(inbox)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(stamped),
    });
  } catch {
    /* email copy is best-effort */
  }
}
