"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import InspiraceContent from "@/components/admin/InspiraceContent";
import NewsletterContent from "@/components/admin/NewsletterContent";
import NewsletterCampaigns from "@/components/admin/NewsletterCampaigns";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "inspirace";

  // Ensure section is always set in URL
  useEffect(() => {
    if (!searchParams.get("section")) {
      router.replace("/admin?section=inspirace");
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-7xl mx-auto">
      {section === "inspirace" && <InspiraceContent />}
      {section === "newsletter" && <NewsletterContent />}
      {section === "newsletter-campaigns" && <NewsletterCampaigns />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground/60">Načítání...</p>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
