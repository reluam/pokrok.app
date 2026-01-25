import { redirect } from "next/navigation";

export default function AdminInspiraceRedirect() {
  redirect("/admin?section=inspirace");
}
