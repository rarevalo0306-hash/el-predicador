export const REGISTRATION_SHEET_ID =
  "1rym4KeN2WYbAPb0B7SkZId2IaclZYVqASeUzZ3Yk2Io";

export const REGISTRATION_SHEET_URL = `https://docs.google.com/spreadsheets/d/${REGISTRATION_SHEET_ID}/edit`;

const FORMSUBMIT_URL = "https://formsubmit.co/ajax/rarevalo0306@gmail.com";

export type RegistrationRow = {
  name: string;
  email: string;
  phone: string;
  address: string;
  locale: string;
  origin?: string;
};

export async function forwardRegistration(row: RegistrationRow) {
  const stamped = {
    ...row,
    fecha: new Date().toISOString(),
    origen: row.origin || "app",
    _subject: "El Predicador — nuevo registro",
    _template: "table",
    _captcha: "false",
  };
  try {
    await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(stamped),
    });
  } catch {
    /* email copy is best-effort */
  }
}
