import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Space se stal prvním realmem encyklopedie → /vesmir
export default function SpacePage() {
  permanentRedirect("/vesmir");
}
