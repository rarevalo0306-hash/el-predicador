import { t, type Locale } from "@/lib/i18n";

export type MessageKind =
  | "animo"
  | "oracion"
  | "paz"
  | "evangelio"
  | "bendicion"
  | "personal";

const KIND_KEYS: Record<
  MessageKind,
  "kindAnimo" | "kindOracion" | "kindPaz" | "kindEvangelio" | "kindBendicion" | "kindPersonal"
> = {
  animo: "kindAnimo",
  oracion: "kindOracion",
  paz: "kindPaz",
  evangelio: "kindEvangelio",
  bendicion: "kindBendicion",
  personal: "kindPersonal",
};

const TEMPLATE_KEYS = {
  animo: { label: "kindAnimo", text: "tplAnimo" },
  oracion: { label: "kindOracion", text: "tplOracion" },
  paz: { label: "kindPaz", text: "tplPaz" },
  evangelio: { label: "kindEvangelio", text: "tplEvangelio" },
  bendicion: { label: "kindBendicion", text: "tplBendicion" },
} as const;

export const MESSAGE_KIND_IDS: MessageKind[] = [
  "animo",
  "oracion",
  "paz",
  "evangelio",
  "bendicion",
  "personal",
];

export function messageKinds(locale: Locale) {
  return MESSAGE_KIND_IDS.map((id) => ({
    id,
    label: t(locale, KIND_KEYS[id]),
  }));
}

export function messageTemplates(locale: Locale) {
  return (Object.keys(TEMPLATE_KEYS) as Array<keyof typeof TEMPLATE_KEYS>).map(
    (id) => ({
      id,
      label: t(locale, TEMPLATE_KEYS[id].label),
      text: t(locale, TEMPLATE_KEYS[id].text),
    }),
  );
}

export function kindLabel(kind: MessageKind, locale: Locale) {
  return t(locale, KIND_KEYS[kind] ?? "kindPersonal");
}

export function kindFromTemplate(id: string | null, note: string): MessageKind {
  if (id && MESSAGE_KIND_IDS.includes(id as MessageKind)) {
    return id as MessageKind;
  }
  return note.trim() ? "personal" : "personal";
}
