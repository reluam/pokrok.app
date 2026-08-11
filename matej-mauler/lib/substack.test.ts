import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml } from "./substack";

describe("sanitizeArticleHtml", () => {
  it("zahodí <script> i s obsahem", () => {
    const out = sanitizeArticleHtml('<p>ok</p><script>alert(1)</script><p>dál</p>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>ok</p>");
    expect(out).toContain("<p>dál</p>");
  });

  it("zahodí iframe, object, embed i samostatné značky", () => {
    const out = sanitizeArticleHtml('<iframe src="https://zlo.example"></iframe><embed src="x"><object data="y"></object>');
    expect(out).not.toMatch(/<(iframe|embed|object)/i);
  });

  it("odstraní on* handlery ve všech třech zápisech", () => {
    const out = sanitizeArticleHtml(`<img src="a.png" onerror="alert(1)"><a href="#" onclick='x()'>t</a><b onmouseover=y>h</b>`);
    expect(out).not.toMatch(/on[a-z]+\s*=/i);
    expect(out).toContain('src="a.png"');
  });

  it("zneškodní javascript: URL, ale běžné odkazy nechá", () => {
    const out = sanitizeArticleHtml(`<a href="javascript:alert(1)">x</a><a href="https://matejmauler.com">y</a>`);
    expect(out).not.toContain("javascript:");
    expect(out).toContain('href="https://matejmauler.com"');
  });

  it("nechá běžnou typografii článku beze změny", () => {
    const html = '<h2>Nadpis</h2><p>Text s <em>důrazem</em> a <a href="https://x.example">odkazem</a>.</p><blockquote>citace</blockquote>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });
});
