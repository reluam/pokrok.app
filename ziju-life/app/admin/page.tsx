"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import NewsletterContent from "@/components/admin/NewsletterContent";
import NewsletterCampaigns from "@/components/admin/NewsletterCampaigns";
import SettingsContent from "@/components/admin/SettingsContent";
import CrmContent from "@/components/admin/CrmContent";
import BookingSlotsContent from "@/components/admin/BookingSlotsContent";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "newsletter";

  useEffect(() => {
    if (!searchParams.get("section")) {
      router.replace("/admin?section=newsletter");
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-7xl mx-auto">
      {section === "newsletter" && <NewsletterContent />}
      {section === "newsletter-campaigns" && <NewsletterCampaigns />}
      {section === "crm" && <CrmContent />}
      {section === "rezervace" && <BookingSlotsContent />}
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
