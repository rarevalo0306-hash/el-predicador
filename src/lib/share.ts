import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { Verse } from "@/lib/verses";

export function formatVerseMessage(
  verse: Verse,
  note?: string,
  fromName?: string,
  locale: Locale = "es",
) {
  const lines: string[] = [];
  const trimmedNote = note?.trim();
  if (trimmedNote) {
    lines.push(trimmedNote, "");
  }
  if (
    verse.id === "evangelio-camino" ||
    verse.id.startsWith("caso-") ||
    verse.id.startsWith("nwt-") ||
    verse.id.startsWith("nvi-")
  ) {
    lines.push(verse.text);
  } else {
    lines.push(`«${verse.text}»`, `— ${verse.ref}`);
    if (verse.source) {
      lines.push(verse.source);
    }
  }
  const name = fromName?.trim();
  if (name) {
    lines.push("", t(locale, "signOff", { name }));
  }
  return lines.join("\n");
}

export function openWhatsApp(text: string, phone?: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const encoded = encodeURIComponent(text);
  const url = digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openSms(text: string, phone?: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const body = encodeURIComponent(text);
  const url = digits ? `sms:${digits}?&body=${body}` : `sms:?&body=${body}`;
  window.location.href = url;
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

export async function tryNativeShare(title: string, text: string) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    await navigator.share({ title, text });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return true;
    return false;
  }
}

export async function tryNativeShareFile(
  title: string,
  text: string,
  file: File,
) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    const withFile = { title, text, files: [file] };
    if (navigator.canShare?.(withFile)) {
      await navigator.share(withFile);
      return true;
    }
    await navigator.share({ title, text });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return true;
    try {
      await navigator.share({ title, text });
      return true;
    } catch (retry) {
      if (retry instanceof Error && retry.name === "AbortError") return true;
      return false;
    }
  }
}

export function openMail(subject: string, body: string) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function printFile(file: File) {
  const url = URL.createObjectURL(file);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    URL.revokeObjectURL(url);
    frame.remove();
    return;
  }
  win.document.open();
  win.document.write(
    `<html><head><title></title></head><body style="margin:0;background:#F4EAD6"></body></html>`,
  );
  win.document.close();
  win.document.title = file.name.replace(/[<>&"'`]/g, "");
  const img = win.document.createElement("img");
  img.src = url;
  img.style.display = "block";
  img.style.width = "100%";
  img.style.height = "auto";
  win.document.body.appendChild(img);
  const done = () => {
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        frame.remove();
      }, 1000);
    }
  };
  if (!img.complete) img.addEventListener("load", done, { once: true });
  else done();
}
