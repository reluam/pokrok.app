import { permanentRedirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Rádio se přestěhovalo do The Lab. Než bude doména, vracíme 404.
export default function RadioPage() {
  const lab = process.env.NEXT_PUBLIC_LAB_URL;
  if (lab) permanentRedirect(`${lab}/radio`);
  notFound();
}
