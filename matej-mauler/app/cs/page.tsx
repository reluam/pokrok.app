import { permanentRedirect } from "next/navigation";

// Web je proteď pouze v angličtině — /cs žije na /.
export default function CsRedirect() {
  permanentRedirect("/");
}
