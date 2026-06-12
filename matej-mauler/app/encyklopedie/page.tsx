import { permanentRedirect } from "next/navigation";

// Projektové URL jsou anglicky — encyklopedie žije na /encyclopedia.
export default function EncyklopedieRedirect() {
  permanentRedirect("/encyclopedia");
}
