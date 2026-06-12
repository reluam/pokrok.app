import { notFound } from "next/navigation";
import { EncyclopediaShell } from "@/components/encyclopedia/Shell";
import { getNode, isRedLink, titleOf } from "@/lib/encyclopedia/graph";
import { getLang } from "@/lib/getLang";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const lang = await getLang();
  const node = getNode(slug);
  if (node) return { title: `${node.title[lang]} — Spaghetti.ltd`, description: node.guide[lang], alternates: { canonical: `/${slug}` } };
  if (isRedLink(slug)) return { title: `${titleOf(slug, lang)} — Spaghetti.ltd`, robots: { index: false } };
  return {};
}

export default async function EncyclopediaPage({ params }: Props) {
  const { slug } = await params;
  const node = getNode(slug);
  if (!node && !isRedLink(slug)) notFound();
  const lang = await getLang();
  // JSON-LD: heslo jako DefinedTerm — strojově čitelná definice pro vyhledávače i LLMka
  const jsonLd = node && {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: node.title[lang],
    description: node.guide[lang],
    url: `https://www.spaghetti.ltd/${node.slug}`,
    inDefinedTermSet: { "@type": "DefinedTermSet", name: "Spaghetti.ltd", url: "https://www.spaghetti.ltd" },
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <EncyclopediaShell initialSlug={slug} lang={lang} />
    </>
  );
}
