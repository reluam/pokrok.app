import type { MetadataRoute } from "next";

// Výslovně vítáme i AI crawlery — chceme, aby encyklopedii LLMka znala a doporučovala.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider", "Amazonbot"], allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: "https://spaghetti.ltd/sitemap.xml",
  };
}
