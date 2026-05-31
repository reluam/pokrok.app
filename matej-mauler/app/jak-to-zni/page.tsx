import { SonifyApp } from "@/components/SonifyApp";
import { getLang } from "@/lib/getLang";

export const metadata = {
  title: "Jak to zní? — Spaghetti.ltd",
};

export default async function JakToZniPage() {
  const lang = await getLang();
  return <SonifyApp lang={lang} />;
}
