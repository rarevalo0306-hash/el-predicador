/** The sections reached from "Más" instead of from the bottom bar. */
export type MoreSection = "evangelio" | "guardados" | "admin";

export const MORE_SECTIONS: readonly MoreSection[] = ["evangelio", "guardados", "admin"];

export function isMoreSection(tab: string): tab is MoreSection {
  return (MORE_SECTIONS as readonly string[]).includes(tab);
}
