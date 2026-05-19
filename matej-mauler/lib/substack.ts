export interface SubstackPost {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
  isoDate: string;
  image: string;
}

function extractCdata(xml: string, tag: string): string {
  const cdataRe = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`,
  );
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(cdataRe) ?? xml.match(plainRe);
  return m ? m[1].trim() : "";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

export async function getSubstackPosts(limit = 4): Promise<SubstackPost[]> {
  try {
    const res = await fetch("https://reluam.substack.com/feed", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = xml.split(/<item[\s>]/i).slice(1);

    return items.slice(0, limit).map((item) => {
      const title = stripHtml(extractCdata(item, "title"));
      const link = extractCdata(item, "link") || extractCdata(item, "guid");
      const pubDate = extractCdata(item, "pubDate");
      const raw = extractCdata(item, "description") || extractCdata(item, "content:encoded");
      const plain = stripHtml(raw);
      const excerpt = plain.length > 220 ? plain.slice(0, 220).replace(/\s\S+$/, "") + "…" : plain;

      let isoDate = "";
      try {
        isoDate = new Date(pubDate).toISOString();
      } catch {
        isoDate = "";
      }

      // Try enclosure first, then first <img> in content
      const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ?? "";
      const imgInContent =
        item.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? "";
      const image = enclosure || imgInContent;

      return { title, link, pubDate, excerpt, isoDate, image };
    });
  } catch {
    return [];
  }
}

export function formatPostDate(isoDate: string, locale: "cs" | "en"): string {
  try {
    return new Date(isoDate).toLocaleDateString(
      locale === "cs" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return "";
  }
}
