import { createContext, useContext } from "react";
import { parseMarkdownLite, type Inline } from "@/lib/markdown-lite";
import { linkVerses, type VerseLink } from "@/lib/verse-links";

const VerseTap = createContext<((link: VerseLink) => void) | undefined>(undefined);

/** Text in which every Bible reference can be tapped, when someone listens. */
function Linked({ text }: { text: string }) {
  const onVerse = useContext(VerseTap);
  if (!onVerse) return <>{text}</>;
  return (
    <>
      {linkVerses(text).map((part, index) =>
        part.link ? (
          <button
            key={index}
            type="button"
            onClick={() => onVerse(part.link!)}
            className="inline cursor-pointer rounded-sm font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {part.text}
          </button>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((part, index) =>
        part.kind === "bold" ? (
          <strong key={index} className="font-semibold">
            <Linked text={part.text} />
          </strong>
        ) : part.kind === "italic" ? (
          <em key={index}>
            <Linked text={part.text} />
          </em>
        ) : (
          <span key={index} className="whitespace-pre-line">
            <Linked text={part.text} />
          </span>
        ),
      )}
    </>
  );
}

/**
 * An answer laid out the way this chat lays out its own replies. With
 * `onVerse`, the references in it ("Juan 3:16") open the passage.
 */
export function MarkdownLite({
  text,
  onVerse,
}: {
  text: string;
  onVerse?: (link: VerseLink) => void;
}) {
  const blocks = parseMarkdownLite(text);
  return (
    <VerseTap.Provider value={onVerse}>
      <div className="flex flex-col gap-2">
        {blocks.map((block, index) => {
          if (block.kind === "heading") {
            return (
              <p
                key={index}
                className={
                  block.level <= 2
                    ? "mt-3 font-serif text-xl leading-snug tracking-tight"
                    : "mt-1 font-serif text-base leading-snug font-medium"
                }
              >
                <Inlines inlines={block.inlines} />
              </p>
            );
          }
          if (block.kind === "quote") {
            return (
              <blockquote
                key={index}
                className="border-l-2 border-primary/40 pl-3 font-serif leading-relaxed"
              >
                <Inlines inlines={block.inlines} />
              </blockquote>
            );
          }
          if (block.kind === "rule") {
          return <hr key={index} className="my-2 border-border" />;
        }
        if (block.kind === "list") {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag
                key={index}
                className={
                  block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"
                }
              >
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inlines inlines={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          return (
            <p key={index}>
              <Inlines inlines={block.inlines} />
            </p>
          );
        })}
      </div>
    </VerseTap.Provider>
  );
}
