import { parseMarkdownLite, type Inline } from "@/lib/markdown-lite";

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((part, index) =>
        part.kind === "bold" ? (
          <strong key={index} className="font-semibold">
            {part.text}
          </strong>
        ) : part.kind === "italic" ? (
          <em key={index}>{part.text}</em>
        ) : (
          <span key={index} className="whitespace-pre-line">
            {part.text}
          </span>
        ),
      )}
    </>
  );
}

/** An answer laid out the way this chat lays out its own replies. */
export function MarkdownLite({ text }: { text: string }) {
  const blocks = parseMarkdownLite(text);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <p key={index} className="font-serif text-base leading-snug font-medium">
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
        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={index}
              className={block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
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
  );
}
