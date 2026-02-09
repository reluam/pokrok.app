"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { NewsletterCampaign } from "@/lib/newsletter-campaigns-db";
import { Mail, ArrowLeft } from "lucide-react";

export default function NewsletterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [newsletter, setNewsletter] = useState<NewsletterCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchNewsletter(params.id as string);
    }
  }, [params.id]);

  const fetchNewsletter = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletters/${id}`);
      if (!res.ok) {
        throw new Error("Newsletter not found");
      }
      const data = await res.json();
      setNewsletter(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching newsletter:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  if (!newsletter) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-foreground/60">Newsletter nenalezen</p>
          <button
            onClick={() => router.push("/blog")}
            className="mt-4 px-6 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
          >
            Zpět na blog
          </button>
        </div>
      </main>
    );
  }

  const newsletterTitle = newsletter.sentAt
    ? `Newsletter - ${new Date(newsletter.sentAt).toLocaleDateString("cs-CZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    : newsletter.subject;

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Zpět na blog
        </button>

        <article className="bg-white rounded-2xl p-8 md:p-10 border-2 border-black/5 space-y-8">
          <div className="flex items-center gap-3">
            <Mail className="text-accent" size={24} />
            <span className="px-4 py-2 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
              Newsletter
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {newsletterTitle}
          </h1>

          {newsletter.body && (
            <div
              className="text-foreground/80 text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: newsletter.body }}
            />
          )}

          {newsletter.sentAt && (
            <div className="pt-6 border-t border-black/10 text-sm text-foreground/60">
              Odesláno: {new Date(newsletter.sentAt).toLocaleString("cs-CZ")}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
