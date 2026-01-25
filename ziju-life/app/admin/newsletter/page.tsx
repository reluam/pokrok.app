import { redirect } from "next/navigation";

export default function AdminNewsletterRedirect() {
  redirect("/admin?section=newsletter");
}
