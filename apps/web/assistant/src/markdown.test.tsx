import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Markdown, parseBlocks } from "./markdown";

function html(text: string, citations = [] as Parameters<typeof Markdown>[0]["citations"]) {
  return renderToStaticMarkup(<Markdown text={text} citations={citations} />);
}

describe("Markdown subset", () => {
  it("renders paragraphs, line breaks, bold and italics", () => {
    const out = html("Your **credit score** was *below* the minimum.\nA second line.\n\nNew paragraph.");
    expect(out).toContain("<strong>credit score</strong>");
    expect(out).toContain("<em>below</em>");
    expect(out).toContain("<br/>");
    expect(out.match(/<p>/g)).toHaveLength(2);
  });

  it("renders bullet and numbered lists", () => {
    const out = html("Reasons:\n- Income too low\n- Score too low\n\n1. Pay down a card\n2. Reapply later");
    expect(out).toContain("<ul><li>Income too low</li><li>Score too low</li></ul>");
    expect(out).toContain('<ol start="1"><li>Pay down a card</li><li>Reapply later</li></ol>');
  });

  it("renders a pipe table", () => {
    const out = html("| Check | Result |\n|---|---|\n| Credit score | Not met |\n| Income | Met |");
    expect(out).toContain("<th scope=\"col\">Check</th>");
    expect(out).toContain("<td>Credit score</td><td>Not met</td>");
    expect(parseBlocks("| a | b |\n|---|---|\n| 1 | 2 |")[0]).toMatchObject({ kind: "table", rows: [["1", "2"]] });
  });

  it("turns [n] markers into citation chips named after the source", () => {
    const out = html("The minimum score is 700 [1, 2].", [
      { label: "1", document_id: "d1", title: "Credit policy" },
      { label: "2", document_id: "d2", title: "Fair practices code" },
    ]);
    expect(out).toContain('aria-label="Source 1: Credit policy"');
    expect(out).toContain('aria-label="Source 2: Fair practices code"');
    expect(out).not.toContain("[1, 2]");
  });

  it("keeps raw HTML as literal text and never creates elements from it", () => {
    const attack = '<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a>';
    const container = document.createElement("div");
    container.innerHTML = html(attack);
    expect(container.querySelector("img, script, iframe")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("<script>alert(2)</script>");
  });

  it("drops non-http link targets but keeps the words", () => {
    const container = document.createElement("div");
    container.innerHTML = html("[click](javascript:alert(1)) and [data](data:text/html,hi) and [policy](https://example.org/p)");
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://example.org/p");
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
    expect(container.querySelector('a[href^="javascript"], a[href^="data"]')).toBeNull();
  });

  it("keeps code spans literal, even when they contain markup", () => {
    const out = html("Use `**not bold** <b>` here");
    expect(out).toContain("<code>**not bold** &lt;b&gt;</code>");
  });
});
