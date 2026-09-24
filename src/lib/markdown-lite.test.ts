import { test } from "node:test";
import assert from "node:assert/strict";
import { hasMarkdown, messageText, parseInlines, parseMarkdownLite } from "./markdown-lite.ts";

test("bold and italic come apart inside a line, everything else stays text", () => {
  assert.deepEqual(parseInlines("Cristo es **vida** y *luz* para ti <b>hoy</b>"), [
    { kind: "text", text: "Cristo es " },
    { kind: "bold", text: "vida" },
    { kind: "text", text: " y " },
    { kind: "italic", text: "luz" },
    { kind: "text", text: " para ti <b>hoy</b>" },
  ]);
  assert.deepEqual(parseInlines("sin formato"), [{ kind: "text", text: "sin formato" }]);
});

test("headings, paragraphs, lists and quotations become blocks", () => {
  const blocks = parseMarkdownLite(
    [
      "## Nacer de nuevo",
      "",
      "Es recibir la vida de Dios.",
      "No es mejorar la conducta.",
      "",
      "> «El que no nace de nuevo, no puede ver el reino de Dios»",
      "> **Juan 3:3**",
      "",
      "- Es un nacimiento del Espíritu (Juan 3:6).",
      "- Se recibe creyendo",
      "  en Él (Juan 1:12).",
      "",
      "1. Cree.",
      "2. Invoca.",
      "",
      "Con cariño.",
    ].join("\n"),
  );
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ["heading", "paragraph", "quote", "list", "list", "paragraph"],
  );
  assert.deepEqual(blocks[1], {
    kind: "paragraph",
    inlines: [{ kind: "text", text: "Es recibir la vida de Dios.\nNo es mejorar la conducta." }],
  });
  const list = blocks[3];
  assert.equal(list.kind === "list" && list.ordered, false);
  assert.equal(
    list.kind === "list" && list.items[1][0].text,
    "Se recibe creyendo en Él (Juan 1:12).",
  );
  const numbered = blocks[4];
  assert.equal(numbered.kind === "list" && numbered.ordered, true);
});

test("plain text is one paragraph per blank-line gap and nothing breaks on empty input", () => {
  assert.deepEqual(parseMarkdownLite(""), []);
  assert.equal(parseMarkdownLite("Hola.\n\nPaz.").length, 2);
});

test("a rule separates blocks", () => {
  const blocks = parseMarkdownLite("Uno\n\n---\n\nDos");
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ["paragraph", "rule", "paragraph"],
  );
});

test("a message is sent without Markdown marks", () => {
  const source = [
    "## La Santa Cena",
    "",
    "Jesús dijo a sus **discípulos**:",
    "",
    "> “Tomad, comed; esto es mi cuerpo.”",
    "> — Mateo 26:26",
    ">",
    "> otra línea",
    "",
    "---",
    "",
    "",
    "### Final",
  ].join("\n");
  assert.equal(
    messageText(source),
    "La Santa Cena\n\nJesús dijo a sus discípulos:\n\n“Tomad, comed; esto es mi cuerpo.”\n— Mateo 26:26\n\notra línea\n\nFinal",
  );
  assert.equal(hasMarkdown(source), true);
  assert.equal(hasMarkdown("Te escribo con respeto. Juan 1:1 dice: el Verbo era Dios."), false);
});
