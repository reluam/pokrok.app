import type { MetadataRoute } from "next";

// Výslovně vítáme i AI crawlery — chceme, aby nás LLMka znala a doporučovala.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider", "Amazonbot"], allow: "/" },
    ],
  };
}
