import { permanentRedirect } from "next/navigation";

// Projektové URL jsou anglicky — Synapse žije na /synapsis.
export default function SynapseRedirect() {
  permanentRedirect("/synapsis");
}
