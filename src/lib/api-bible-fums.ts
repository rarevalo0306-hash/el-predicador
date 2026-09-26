declare global {
  interface Window {
    _BAPI?: { t: (id: string) => void };
  }
}

const FUMS_SCRIPT = "https://cdn.scripture.api.bible/fums/fumsv2.min.js";
let loading: Promise<void> | null = null;
const sent = new Set<string>();

function loadFumsScript() {
  if (typeof window === "undefined" || window._BAPI) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${FUMS_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("fums-load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = FUMS_SCRIPT;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("fums-load")), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

/** Report each displayed API.Bible result once, as its license requires. */
export async function trackApiBibleFums(fumsId: string | undefined) {
  if (!fumsId || typeof window === "undefined" || sent.has(fumsId)) return;
  await loadFumsScript();
  if (!window._BAPI) return;
  window._BAPI.t(fumsId);
  sent.add(fumsId);
}
