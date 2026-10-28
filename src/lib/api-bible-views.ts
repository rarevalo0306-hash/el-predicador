/** Only load the provider's documented tracker; never execute response scripts.
 * No account ID, email, contacts or API credential is sent to the tracker.
 */
export function reportBibleView(meta: { fumsToken?: string; fumsId?: string }) {
  if (typeof window === "undefined") return;
  const w = window as typeof window & {
    fums?: (...args: unknown[]) => void;
    fumsData?: unknown[][];
    _BAPI?: { t: (id: string) => void };
  };
  if (meta.fumsToken) {
    w.fumsData ??= [];
    w.fums ??= (...args) => {
      w.fumsData!.push(args);
    };
    if (!document.querySelector('script[data-bible-fums="v3"]')) {
      const script = document.createElement("script");
      script.src = "https://pkg.api.bible/fumsV3.min.js";
      script.async = true;
      script.dataset.bibleFums = "v3";
      document.head.append(script);
    }
    w.fums("trackView", meta.fumsToken);
  } else if (meta.fumsId) {
    if (w._BAPI) {
      w._BAPI.t(meta.fumsId);
      return;
    }
    let script = document.querySelector<HTMLScriptElement>('script[data-bible-fums="v2"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://cdn.scripture.api.bible/fums/fumsv2.min.js";
      script.async = true;
      script.dataset.bibleFums = "v2";
      document.head.append(script);
    }
    const id = meta.fumsId;
    script.addEventListener("load", () => w._BAPI?.t(id), { once: true });
  }
}
