import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Sound Blaster se stal trasou encyklopedie (Sound Basics) → /zvuk
export default function SoundBlasterPage() {
  permanentRedirect("/zvuk");
}
