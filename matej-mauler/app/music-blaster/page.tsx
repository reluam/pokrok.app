import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Music Blaster se stal trasou encyklopedie → /hudba
export default function MusicBlasterPage() {
  permanentRedirect("/hudba");
}
