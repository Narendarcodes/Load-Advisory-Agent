import { Fragment, type ReactNode } from "react";

import type { Citation } from "./types";

/**
 * A deliberately small Markdown subset for assistant answers: paragraphs, line breaks, bullet and
 * numbered lists, bold, italics, inline code, simple pipe tables and citation chips like [1].
 *
 * Everything is built as React elements from plain strings. There is no HTML channel at all:
 * angle brackets in the model's text stay literal characters, and only http(s) links survive.
 */

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[]; start: number }
  | { kind: "table"; head: string[]; rows: string[][] };

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,4}\s+(.*?)\s*#*\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);
  return body.split("|").map((cell) => cell.trim());
}

export function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: "h", text: heading[1] });
      index += 1;
      continue;
    }
    if (line.includes("|") && index + 1 < lines.length && TABLE_RULE.test(lines[index + 1]) && lines[index + 1].includes("-")) {
      const head = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }
    if (BULLET.test(line)) {
      const items: string[] = [];
      while (index < lines.length && BULLET.test(lines[index])) {
        items.push(BULLET.exec(lines[index])![1]);
        index += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    const numbered = NUMBERED.exec(line);
    if (numbered) {
      const items: string[] = [];
      const start = Number(numbered[1]);
      while (index < lines.length && NUMBERED.test(lines[index])) {
        items.push(NUMBERED.exec(lines[index])![2]);
        index += 1;
      }
      blocks.push({ kind: "ol", items, start });
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !BULLET.test(lines[index]) &&
      !NUMBERED.test(lines[index]) &&
      !HEADING.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ kind: "p", lines: paragraph });
  }
  return blocks;
}

function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Order matters: code first (its contents are literal), then links, citations, bold, italics.
const INLINE =
  /(`[^`\n]+`)|(\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\))|(\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\])|(\*\*([^*\n]+?)\*\*|__([^_\n]+?)__)|(\*([^*\s][^*\n]*?)\*)/g;

function CitationChip({ label, citation }: { label: string; citation?: Citation }) {
  const name = citation ? `Source ${label}: ${citation.title}` : `Source ${label}`;
  return (
    <span className="cite-chip" title={name} aria-label={name} role="note">
      {label}
    </span>
  );
}

export function renderInline(text: string, citations: Citation[] = [], keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let count = 0;
  const byLabel = new Map(citations.map((citation) => [String(citation.label), citation]));
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const key = `${keyPrefix}-${count++}`;
    if (match[1]) {
      out.push(<code key={key}>{match[1].slice(1, -1)}</code>);
    } else if (match[2]) {
      const href = safeHref(match[4]);
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {match[3]}
          </a>
        ) : (
          <Fragment key={key}>{match[3]}</Fragment>
        ),
      );
    } else if (match[5]) {
      const labels = match[6].split(",").map((label) => label.trim());
      out.push(
        <span key={key} className="cite-chips">
          {labels.map((label) => (
            <CitationChip key={label} label={label} citation={byLabel.get(label)} />
          ))}
        </span>,
      );
    } else if (match[7]) {
      out.push(<strong key={key}>{renderInline(match[8] ?? match[9] ?? "", citations, key)}</strong>);
    } else if (match[10]) {
      out.push(<em key={key}>{match[11]}</em>);
    }
    last = at + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, citations = [] }: { text: string; citations?: Citation[] }) {
  const blocks = parseBlocks(text);
  return (
    <div className="md">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case "h":
            return (
              <p key={key} className="md-h">
                <strong>{renderInline(block.text, citations, key)}</strong>
              </p>
            );
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, citations, `${key}-${i}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} start={block.start}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, citations, `${key}-${i}`)}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={key} className="md-table">
                <table>
                  <thead>
                    <tr>
                      {block.head.map((cell, i) => (
                        <th key={i} scope="col">
                          {renderInline(cell, citations, `${key}-h${i}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, i) => (
                          <td key={i}>{renderInline(cell, citations, `${key}-${r}-${i}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return (
              <p key={key}>
                {block.lines.map((line, i) => (
                  <Fragment key={i}>
                    {i ? <br /> : null}
                    {renderInline(line, citations, `${key}-${i}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
