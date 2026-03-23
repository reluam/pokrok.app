import { notFound } from "next/navigation";
import { TOOLS } from "@repo/types";
import { ToolForm } from "../../../../components/ToolForm";

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) notFound();
  return <ToolForm tool={tool} />;
}
