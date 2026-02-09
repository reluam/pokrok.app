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

  const convertTextToHtml = (text: string): string => {
    // Extract and preserve HTML links
    const linkRegex = /<a\s+href=["']([^"']+)["']>([^<]+)<\/a>/gi;
    const links: Array<{ url: string; text: string; placeholder: string }> = [];
    let linkIndex = 0;
    
    let processedText = text.replace(linkRegex, (match, url, linkText) => {
      const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`;
      links.push({ url, text: linkText, placeholder });
      linkIndex++;
      return placeholder;
    });
    
    // Escape HTML entities
    processedText = processedText
      .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[\da-f]+;|__LINK_PLACEHOLDER_)/gi, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Restore links
    links.forEach(({ url, text, placeholder }) => {
      const linkHtml = `<a href="${url.replace(/&amp;/g, '&')}" style="color: #FF8C42; text-decoration: underline;">${text}</a>`;
      processedText = processedText.replace(placeholder, linkHtml);
    });
    
    // Convert standalone URLs to links
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      if (processedText.includes(`href="${url}"`) || processedText.includes(`href='${url}'`)) {
        return url;
      }
      return `<a href="${url}" style="color: #FF8C42; text-decoration: underline;">${url}</a>`;
    });
    
    // Convert line breaks
    processedText = processedText.replace(/\n\n/g, '</p><p style="margin: 16px 0;">');
    processedText = processedText.replace(/\n/g, '<br>');
    
    if (!processedText.startsWith('<')) {
      processedText = `<p style="margin: 0 0 16px;">${processedText}</p>`;
    }
    
    return processedText;
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

          {newsletter.description && (
            <div
              className="text-foreground/80 text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: convertTextToHtml(newsletter.description) }}
            />
          )}

          <div className="space-y-6">
            {newsletter.sections.map((section, index) => (
              <div key={index} className="space-y-4">
                {section.title && (
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {section.title}
                  </h2>
                )}
                {section.description && (
                  <div
                    className="text-foreground/80 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: convertTextToHtml(section.description) }}
                  />
                )}
              </div>
            ))}
          </div>

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
