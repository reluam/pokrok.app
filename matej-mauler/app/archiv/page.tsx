import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Archiv splynul s homepage — všechno je zase na jednom místě.
export default function ArchivPage() {
  permanentRedirect("/");
}
