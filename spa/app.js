  const T = {
    es: {
      tagline: "Mensajes de la Biblia",
      hoy: "Hoy", biblia: "Biblia", temas: "Temas", guardados: "Guardados",
      verseOfDay: "Versículo de hoy",
      send: "Enviar", save: "Guardar", saved: "Guardado",
      search: "Buscar pasaje o palabra",
      allThemes: "Todos",
      emptySaved: "Todavía no guardas versículos. Toca el corazón en uno que quieras repetir.",
      emptySearch: "No hay coincidencias. Prueba otra palabra o un libro, como Juan.",
      sendTitle: "Enviar mensaje",
      note: "Nota (opcional)",
      from: "De (tu nombre)",
      whatsapp: "WhatsApp", sms: "SMS", share: "Compartir", copy: "Copiar",
      copied: "Mensaje copiado",
      recobro: "Versión Recobro",
      close: "Cerrar",
      pickTheme: "Elige un tema",
      contactTitle: "¿Quieres recibir la palabra?",
      contactLine: "Deja tu nombre, correo, teléfono y dirección. Solo el predicador ve estos datos.",
      contactName: "Nombre",
      contactEmail: "Correo",
      contactPhone: "Teléfono",
      contactAddress: "Dirección",
      contactConsent: "Acepto que guarden estos datos para enviarme versículos y estar en contacto.",
      contactSubmit: "Guardar mis datos",
      contactOk: "Datos enviados. Gracias.",
      contactFail: "No se pudieron enviar. Revisa los campos.",
      contactNeed: "Marca la casilla para guardar.",
      peopleLink: "Soy el predicador",
      peopleTitle: "Personas registradas",
      peoplePin: "Clave del predicador",
      peopleOpen: "Ver lista",
      peopleHint: "Los registros llegan a tu correo. Confirma el primer aviso de FormSubmit.",
    },
    en: {
      tagline: "Bible messages",
      hoy: "Today", biblia: "Bible", temas: "Themes", guardados: "Saved",
      verseOfDay: "Verse of the day",
      send: "Send", save: "Save", saved: "Saved",
      search: "Search passage or word",
      allThemes: "All",
      emptySaved: "You have not saved verses yet. Tap the heart on one you want to keep.",
      emptySearch: "No matches. Try another word or a book, like John.",
      sendTitle: "Send message",
      note: "Note (optional)",
      from: "From (your name)",
      whatsapp: "WhatsApp", sms: "SMS", share: "Share", copy: "Copy",
      copied: "Message copied",
      recobro: "Recovery Version",
      close: "Close",
      pickTheme: "Choose a theme",
      contactTitle: "Want to receive the word?",
      contactLine: "Leave your name, email, phone, and address. Only the preacher sees these details.",
      contactName: "Name",
      contactEmail: "Email",
      contactPhone: "Phone",
      contactAddress: "Address",
      contactConsent: "I agree these details may be kept to send me verses and stay in touch.",
      contactSubmit: "Save my details",
      contactOk: "Details sent. Thank you.",
      contactFail: "Could not send. Check the fields.",
      contactNeed: "Check the box to save.",
      peopleLink: "I am the preacher",
      peopleTitle: "Registered people",
      peoplePin: "Preacher’s key",
      peopleOpen: "View list",
      peopleHint: "Records arrive in your email. Confirm the first FormSubmit message.",
    }
  };

  const state = {
    locale: (localStorage.getItem("preacher-locale") === "en" ? "en" : "es"),
    tab: "hoy",
    query: "",
    theme: null,
    saved: JSON.parse(localStorage.getItem("preacher-saved") || "[]"),
    sending: null,
    data: null,
  };

  const $ = (id) => document.getElementById(id);
  const t = (k) => T[state.locale][k];

  function localize(v) {
    if (state.locale === "en" && state.data.en[v.id]) {
      const e = state.data.en[v.id];
      return { ...v, ref: e.ref, book: e.book, text: e.text };
    }
    return v;
  }

  function todayVerse() {
    const verses = state.data.verses;
    const start = new Date(2024, 0, 1);
    const now = new Date();
    const days = Math.floor((now - start) / 86400000);
    return verses[((days % verses.length) + verses.length) % verses.length];
  }

  function matches(v, q) {
    if (!q) return true;
    const s = `${v.ref} ${v.book} ${v.text} ${v.id}`.toLowerCase();
    const e = state.data.en[v.id];
    const en = e ? `${e.ref} ${e.book} ${e.text}`.toLowerCase() : "";
    return s.includes(q) || en.includes(q);
  }

  function formatMessage(v) {
    const note = (state.note || "").trim();
    const from = (state.from || "").trim();
    const loc = localize(v);
    const lines = [];
    if (note) lines.push(note, "");
    lines.push(`«${loc.text}»`, `— ${loc.ref}`, t("recobro"));
    if (from) lines.push("", (state.locale === "es" ? `Con cariño, ${from}` : `With love, ${from}`));
    return lines.join("\n");
  }

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.display = "none"; }, 1800);
  }

  function toggleSave(id) {
    const i = state.saved.indexOf(id);
    if (i >= 0) state.saved.splice(i, 1);
    else state.saved.unshift(id);
    localStorage.setItem("preacher-saved", JSON.stringify(state.saved));
    render();
  }

  function openSend(v) { state.sending = v; render(); }
  function closeSend() { state.sending = null; render(); }

  async function send(kind) {
    const v = state.sending;
    if (!v) return;
    const text = formatMessage(v);
    const encoded = encodeURIComponent(text);
    if (kind === "wa") {
      window.open("https://wa.me/?text=" + encoded, "_blank", "noopener");
    } else if (kind === "sms") {
      window.location.href = "sms:?&body=" + encoded;
    } else if (kind === "share" && navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast(t("copied"));
    }
  }

  function icon(name) {
    const p = {
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 9 4.9-9 4.9L3 6.9 12 2z"/><path d="m3 12 9 4.9 9-4.9"/><path d="m3 17 9 4.9 9-4.9"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 1 0-0-7.8z"/></svg>',
    };
    return p[name];
  }

  function contactForm() {
    return `<article class="card" style="margin-top:1rem">
      <div class="ref">${t("contactTitle")}</div>
      <p class="muted">${t("contactLine")}</p>
      <form id="contact-form" style="display:grid;gap:.65rem;margin-top:.9rem">
        <input class="field" name="name" autocomplete="name" required placeholder="${t("contactName")}" />
        <input class="field" name="email" type="email" autocomplete="email" required placeholder="${t("contactEmail")}" />
        <input class="field" name="phone" type="tel" autocomplete="tel" required placeholder="${t("contactPhone")}" />
        <textarea name="address" required placeholder="${t("contactAddress")}"></textarea>
        <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;height:0;width:0;overflow:hidden" />
        <label class="muted" style="display:flex;gap:.6rem;align-items:flex-start">
          <input type="checkbox" name="consent" required style="margin-top:.25rem;width:1.1rem;height:1.1rem" />
          <span>${t("contactConsent")}</span>
        </label>
        <button class="btn full" type="submit">${t("contactSubmit")}</button>
      </form>
    </article>`;
  }

  async function sendContact(form) {
    const data = new FormData(form);
    if (!data.get("consent")) { toast(t("contactNeed")); return; }
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      address: String(data.get("address") || "").trim(),
      company: String(data.get("company") || "").trim(),
      consent: true,
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("api");
      localStorage.setItem("preacher-contacted", "1");
      toast(t("contactOk"));
      render();
    } catch (err) {
      try {
        const mail = await fetch("https://formsubmit.co/ajax/rarevalo0306@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...payload, _subject: "Nuevo contacto · El Predicador" }),
        });
        if (!mail.ok) throw new Error("mail");
        localStorage.setItem("preacher-contacted", "1");
        toast(t("contactOk"));
        render();
      } catch {
        toast(t("contactFail"));
      }
    }
  }

  async function openPeople() {
    const pin = $("people-pin")?.value || "";
    const msg = $("people-msg");
    try {
      const res = await fetch("/api/contact", { headers: { "X-Admin-Pin": pin } });
      const body = await res.json();
      if (!res.ok) { if (msg) msg.textContent = t("peopleHint"); return; }
      if (msg) msg.textContent = body.via === "email" ? t("peopleHint") : t("peopleHint");
    } catch {
      if (msg) msg.textContent = t("peopleHint");
    }
  }

  function verseCard(v, opts = {}) {
    const loc = localize(v);
    const saved = state.saved.includes(v.id);
    return `<article class="card">
      <div class="ref">${loc.ref}</div>
      <p class="verse">${loc.text}</p>
      <p class="src">${t("recobro")}</p>
      <div class="row" style="margin-top:.9rem">
        <button class="btn" type="button" data-send="${v.id}">${t("send")}</button>
        <button class="btn ghost heart ${saved ? "on" : ""}" type="button" data-save="${v.id}">${saved ? "♥ " + t("saved") : "♡ " + t("save")}</button>
      </div>
    </article>`;
  }

  function renderMain() {
    const verses = state.data.verses;
    if (state.tab === "hoy") {
      const v = todayVerse();
      const asked = localStorage.getItem("preacher-contacted") === "1";
      const form = asked ? "" : contactForm();
      const admin = `<p class="empty" style="padding:1rem 0 0"><button type="button" class="muted" id="open-people" style="background:none;border:0;text-decoration:underline">${t("peopleLink")}</button></p>`;
      return `<h2>${t("verseOfDay")}</h2>${verseCard(v)}${form}${admin}`;
    }
    if (state.tab === "temas") {
      const chips = state.data.themes.map(th => {
        const label = state.locale === "en" ? th.en : th.es;
        const on = state.theme === th.id ? "on" : "";
        return `<button class="chip ${on}" type="button" data-theme="${th.id}">${label}</button>`;
      }).join("");
      const list = verses.filter(v => !state.theme || v.themes.includes(state.theme));
      return `<h2>${t("pickTheme")}</h2>
        <div class="chips"><button class="chip ${state.theme ? "" : "on"}" type="button" data-theme="">${t("allThemes")}</button>${chips}</div>
        <div class="list" style="margin-top:.8rem">${list.map(v => verseCard(v)).join("")}</div>`;
    }
    if (state.tab === "guardados") {
      const list = verses.filter(v => state.saved.includes(v.id));
      if (!list.length) return `<h2>${t("guardados")}</h2><p class="empty">${t("emptySaved")}</p>`;
      return `<h2>${t("guardados")}</h2><div class="list">${list.map(v => verseCard(v)).join("")}</div>`;
    }
    const q = state.query.trim().toLowerCase();
    const list = verses.filter(v => matches(v, q));
    return `<h2>${t("biblia")}</h2>
      <input class="search" id="q" value="${state.query.replace(/"/g, '"')}" placeholder="${t("search")}" />
      <div class="list" style="margin-top:.9rem">${list.length ? list.map(v => verseCard(v)).join("") : `<p class="empty">${t("emptySearch")}</p>`}</div>`;
  }

  function renderNav() {
    const tabs = [
      ["hoy", "sun", t("hoy")],
      ["biblia", "book", t("biblia")],
      ["temas", "layers", t("temas")],
      ["guardados", "heart", t("guardados")],
    ];
    $("nav").innerHTML = tabs.map(([id, ic, label]) =>
      `<button type="button" class="${state.tab===id?"on":""}" data-tab="${id}">${icon(ic)}<span>${label}</span></button>`
    ).join("");
  }

  function renderSheet() {
    const sheet = $("sheet");
    if (state.people) {
      sheet.className = "sheet on";
      sheet.innerHTML = `<div class="panel">
        <div class="grab"></div>
        <h2>${t("peopleTitle")}</h2>
        <p class="muted">${t("peopleHint")}</p>
        <label class="muted" style="display:block;margin-top:.8rem">${t("peoplePin")}</label>
        <input class="field" id="people-pin" type="password" autocomplete="off" />
        <button class="btn full" style="margin-top:.8rem" type="button" id="people-open">${t("peopleOpen")}</button>
        <p class="muted" id="people-msg" style="margin-top:.8rem"></p>
        <button class="btn ghost full" style="margin-top:.7rem" type="button" id="close-sheet">${t("close")}</button>
      </div>`;
      return;
    }
    if (!state.sending) { sheet.className = "sheet"; sheet.innerHTML = ""; return; }
    const loc = localize(state.sending);
    sheet.className = "sheet on";
    sheet.innerHTML = `<div class="panel">
      <div class="grab"></div>
      <h2>${t("sendTitle")}</h2>
      <p class="ref">${loc.ref}</p>
      <p class="verse" style="font-size:1.1rem">${loc.text}</p>
      <label class="muted">${t("note")}</label>
      <textarea id="note" placeholder="">${(state.note||"")}</textarea>
      <label class="muted" style="display:block;margin-top:.6rem">${t("from")}</label>
      <input class="field" id="from" value="${(state.from||"").replace(/"/g, '"')}" />
      <div class="row" style="margin-top:1rem">
        <button class="btn" type="button" data-kind="wa">${t("whatsapp")}</button>
        <button class="btn ghost" type="button" data-kind="sms">${t("sms")}</button>
        <button class="btn ghost" type="button" data-kind="share">${t("share")}</button>
        <button class="btn ghost" type="button" data-kind="copy">${t("copy")}</button>
      </div>
      <button class="btn ghost full" style="margin-top:.7rem" type="button" id="close-sheet">${t("close")}</button>
    </div>`;
  }

  function render() {
    document.documentElement.lang = state.locale;
    $("tagline").textContent = t("tagline");
    $("lang-es").className = state.locale === "es" ? "on" : "";
    $("lang-en").className = state.locale === "en" ? "on" : "";
    $("main").innerHTML = renderMain();
    renderNav();
    renderSheet();
    const q = $("q");
    if (q) {
      q.focus();
      const v = q.value;
      q.setSelectionRange(v.length, v.length);
    }
  }

  function bind() {
    document.body.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) { state.tab = tab.dataset.tab; render(); return; }
      const theme = e.target.closest("[data-theme]");
      if (theme) { state.theme = theme.dataset.theme || null; render(); return; }
      const save = e.target.closest("[data-save]");
      if (save) { toggleSave(save.dataset.save); return; }
      const sendBtn = e.target.closest("[data-send]");
      if (sendBtn) {
        state.sending = state.data.verses.find(v => v.id === sendBtn.dataset.send);
        render(); return;
      }
      const kind = e.target.closest("[data-kind]");
      if (kind) { state.note = $("note")?.value; state.from = $("from")?.value; send(kind.dataset.kind); return; }
      if (e.target.id === "open-people") { state.people = true; render(); return; }
      if (e.target.id === "people-open") { openPeople(); return; }
      if (e.target.id === "close-sheet" || e.target.id === "sheet") { closeSend(); state.people = false; render(); return; }
      if (e.target.id === "lang-es") { state.locale = "es"; localStorage.setItem("preacher-locale","es"); render(); return; }
      if (e.target.id === "lang-en") { state.locale = "en"; localStorage.setItem("preacher-locale","en"); render(); return; }
    });
    document.body.addEventListener("submit", (e) => {
      if (e.target.id === "contact-form") {
        e.preventDefault();
        sendContact(e.target);
      }
    });
    document.body.addEventListener("input", (e) => {
      if (e.target.id === "q") {
        state.query = e.target.value;
        render();
      }
      if (e.target.id === "note") state.note = e.target.value;
      if (e.target.id === "from") state.from = e.target.value;
    });
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(url + " " + res.status);
    return (await res.text()).replace(/\s+/g, "");
  }
  async function loadParts() {
    const gh = "https://raw.githubusercontent.com/rarevalo0306-hash/el-predicador/main/spa/";
    try { return [await fetchText("/data1.b64"), await fetchText("/data2.b64")]; }
    catch (e) { return [await fetchText(gh + "data1.b64"), await fetchText(gh + "data2.b64")]; }
  }
  async function boot() {
    try {
      const parts = await loadParts();
      const bin = Uint8Array.from(atob(parts[0] + parts[1]), function(c) { return c.charCodeAt(0); });
      const ds = new DecompressionStream("gzip");
      const stream = new Blob([bin]).stream().pipeThrough(ds);
      const text = await new Response(stream).text();
      state.data = JSON.parse(text);
      bind();
      render();
    } catch (err) {
      document.getElementById("main").innerHTML = "<p class=\"empty\">No se pudieron cargar los versículos.</p>";
      console.error(err);
    }
  }
  boot();
