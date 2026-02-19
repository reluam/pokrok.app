"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import InspiraceContent from "@/components/admin/InspiraceContent";
import NewsletterContent from "@/components/admin/NewsletterContent";
import NewsletterCampaigns from "@/components/admin/NewsletterCampaigns";
import SettingsContent from "@/components/admin/SettingsContent";
import CrmContent from "@/components/admin/CrmContent";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "blog";

  useEffect(() => {
    if (!searchParams.get("section")) {
      router.replace("/admin?section=blog");
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-7xl mx-auto">
      {section === "blog" && <InspiraceContent mode="blog" />}
      {section === "inspirace" && <InspiraceContent mode="inspirace" />}
      {section === "newsletter" && <NewsletterContent />}
      {section === "newsletter-campaigns" && <NewsletterCampaigns />}
      {section === "crm" && <CrmContent />}
      {section === "settings" && <SettingsContent />}
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
