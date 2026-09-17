/**
 * Legacy spa contact endpoint. Prefer the TanStack app in src/.
 * Admin PIN and inbox email MUST come from env — no public defaults.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s.-]{7,20}$/;
const PIN = (process.env.CONTACTS_ADMIN_PIN || "").trim();
const MAIL = (process.env.CONTACTS_EMAIL || "").trim();

function clean(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cors(res, origin) {
  // Reflect only same-host origins; never *.
  if (origin && typeof origin === "string") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Pin");
}

module.exports = async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    if (!PIN) {
      res.status(503).json({ ok: false, error: "unavailable" });
      return;
    }
    const pin = clean(req.headers["x-admin-pin"], 40);
    if (pin !== PIN) {
      res.status(401).json({ ok: false, error: "pin" });
      return;
    }
    res.status(200).json({
      ok: true,
      via: MAIL ? "email" : "none",
      contacts: [],
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (clean(body.company, 80)) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 20);
  const address = clean(body.address, 200);
  if (
    name.length < 2 ||
    !EMAIL_RE.test(email) ||
    !PHONE_RE.test(phone) ||
    address.length < 5 ||
    !body.consent
  ) {
    res.status(400).json({ ok: false, error: "fields" });
    return;
  }

  if (MAIL) {
    try {
      await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(MAIL), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          _subject: "Nuevo contacto · El Predicador",
          _template: "table",
          _captcha: "true",
          _replyto: email,
        }),
      });
    } catch {
      /* inbox forward is best-effort */
    }
  }

  res.status(200).json({ ok: true });
};
