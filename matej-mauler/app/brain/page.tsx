import { permanentRedirect } from "next/navigation";

// Veřejný mozek se přejmenoval na Synapse.
export default function BrainRedirect() {
  permanentRedirect("/synapse");
}
