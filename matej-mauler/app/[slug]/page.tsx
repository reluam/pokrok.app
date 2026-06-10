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
  if (node) return { title: `${node.title[lang]} — Spaghetti.ltd`, description: node.guide[lang] };
  if (isRedLink(slug)) return { title: `${titleOf(slug, lang)} — Spaghetti.ltd`, robots: { index: false } };
  return {};
}

export default async function EncyclopediaPage({ params }: Props) {
  const { slug } = await params;
  if (!getNode(slug) && !isRedLink(slug)) notFound();
  const lang = await getLang();
  return <EncyclopediaShell initialSlug={slug} lang={lang} />;
}
