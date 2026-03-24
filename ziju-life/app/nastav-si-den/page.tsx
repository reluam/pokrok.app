import { redirect } from "next/navigation";

export default function NastavSiDenPage() {
  redirect("/laborator/dashboard?tab=nastav-si-den");
}
