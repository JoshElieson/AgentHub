import { cn } from "@/lib/utils";
import { CodeBlock } from "./ui/command-block";
import { Fragment, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Minimal, dependency-free Markdown renderer covering the subset used across
// AgentDock READMEs: headings, paragraphs, lists, fenced code, blockquotes,
// horizontal rules, tables, and inline code/bold/italic/links.
// ---------------------------------------------------------------------------

const INLINE_RE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(\*[^*]+\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-muted"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-content">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)!;
      const external = mm[2].startsWith("http");
      nodes.push(
        <a
          key={key}
          href={mm[2]}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="font-medium text-brand-muted underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
        >
          {mm[1]}
        </a>
      );
    } else {
      nodes.push(
        <em key={key} className="italic text-content/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownPanel({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <CodeBlock key={key++} code={buf.join("\n")} language={lang || "text"} className="my-4" />
      );
      continue;
    }

    // Blank
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-6 border-line" />);
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const styles = [
        "mt-8 mb-3 border-b border-line pb-2 text-xl font-semibold tracking-tight text-content",
        "mt-7 mb-3 text-lg font-semibold tracking-tight text-content",
        "mt-6 mb-2 text-base font-semibold text-content",
        "mt-5 mb-2 text-sm font-semibold text-content",
      ][level - 1];
      const Tag = (["h1", "h2", "h3", "h4"] as const)[level - 1];
      blocks.push(
        <Tag key={key++} className={cn("first:mt-0", styles)}>
          {renderInline(text, `h${key}`)}
        </Tag>
      );
      i++;
      continue;
    }

    // Table
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="my-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-2">
              <tr>
                {header.map((c, ci) => (
                  <th key={ci} className="border-b border-line px-3 py-2 text-left font-semibold text-content">
                    {renderInline(c, `th${key}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line/60 last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted">
                      {renderInline(c, `td${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-4 rounded-r-lg border-l-2 border-brand/60 bg-brand-dim/40 py-2 pl-4 pr-3 text-sm text-muted"
        >
          {renderInline(buf.join(" "), `bq${key}`)}
        </blockquote>
      );
      continue;
    }

    // Lists (unordered / ordered)
    const isUl = /^\s*[-*]\s+/.test(line);
    const isOl = /^\s*\d+\.\s+/.test(line);
    if (isUl || isOl) {
      const items: string[] = [];
      const re = isUl ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/;
      while (
        i < lines.length &&
        (isUl ? /^\s*[-*]\s+/.test(lines[i]) : /^\s*\d+\.\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(re, ""));
        i++;
      }
      const ListTag = isOl ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={key++}
          className={cn(
            "my-3 space-y-1.5 pl-5 text-sm text-muted",
            isOl ? "list-decimal" : "list-disc",
            "marker:text-subtle"
          )}
        >
          {items.map((it, ii) => (
            <li key={ii} className="pl-1 leading-relaxed">
              {renderInline(it, `li${key}-${ii}`)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph (gather consecutive plain lines)
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !lines[i].trimStart().startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-3 text-sm leading-relaxed text-muted">
        {renderInline(buf.join(" "), `p${key}`)}
      </p>
    );
  }

  return <div className={cn("text-content", className)}>{blocks.map((b, idx) => <Fragment key={idx}>{b}</Fragment>)}</div>;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}
