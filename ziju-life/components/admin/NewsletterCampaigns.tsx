"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, Eye, Send, Save, X, Link as LinkIcon, Copy, Loader2 } from "lucide-react";
import type { NewsletterCampaign, NewsletterSection, NewsletterTemplate } from "@/lib/newsletter-campaigns-db";

type ViewMode = "list" | "edit" | "preview" | "view";

const TEMPLATE_STORAGE_KEY = "newsletter_template";

export default function NewsletterCampaigns() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    sections: [{ title: "", description: "" }] as NewsletterSection[],
    scheduledAt: "",
  });
  const [selectedText, setSelectedText] = useState<{ sectionIndex: number; start: number; end: number } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [duplicatingCampaignId, setDuplicatingCampaignId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    fetchCampaigns();
    loadTemplate();
  }, []);

  const loadTemplate = () => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        const template: NewsletterTemplate = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          subject: template.subject || "",
          description: template.description || "",
        }));
      }
    } catch (err) {
      console.error("Error loading template:", err);
    }
  };

  const saveTemplate = () => {
    try {
      const template: NewsletterTemplate = {
        subject: formData.subject,
        description: formData.description,
      };
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
      alert("Šablona uložena!");
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Chyba při ukládání šablony");
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/newsletter-campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      setCampaigns(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setLoading(false);
    }
  };

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    loadTemplate(); // Load template when creating new campaign
    setFormData((prev) => ({
      ...prev,
      sections: [{ title: "", description: "" }],
      scheduledAt: "",
    }));
    setViewMode("edit");
  };

  const handleEditCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      subject: campaign.subject,
      description: campaign.description || "",
      sections: campaign.sections.length > 0 
        ? campaign.sections 
        : [{ title: "", description: "" }],
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setViewMode("edit");
  };

  const handleViewCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      subject: campaign.subject,
      description: campaign.description || "",
      sections: campaign.sections.length > 0 
        ? campaign.sections 
        : [{ title: "", description: "" }],
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setViewMode("view");
  };

  const handleDuplicateCampaign = async (campaign: NewsletterCampaign) => {
    setShowDuplicateModal(true);
    setDuplicatingCampaignId(campaign.id);
    setDuplicateError(null);

    try {
      const res = await fetch("/api/admin/newsletter-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: campaign.subject,
          description: campaign.description || "",
          sections: campaign.sections,
          scheduledAt: null, // No scheduled date for duplicated campaign
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to duplicate campaign");
      }

      await fetchCampaigns();
      
      // Show success and close modal after delay
      setDuplicatingCampaignId(null);
      setTimeout(() => {
        setShowDuplicateModal(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error duplicating campaign:", err);
      setDuplicateError(err.message || "Chyba při duplikování newsletteru");
      setDuplicatingCampaignId(null);
    }
  };

  const handleAddSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { title: "", description: "" }],
    });
  };

  const handleRemoveSection = (index: number) => {
    if (formData.sections.length <= 1) {
      alert("Musíš mít alespoň jednu sekci");
      return;
    }
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index),
    });
  };

  const handleSectionChange = (index: number, field: "title" | "description", value: string) => {
    const newSections = [...formData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData({ ...formData, sections: newSections });
  };

  const handleTextSelection = (sectionIndex: number) => {
    const textarea = descriptionRefs.current[sectionIndex];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Only save selection, don't open dialog
    if (start !== end) {
      setSelectedText({ sectionIndex, start, end });
    } else {
      setSelectedText(null);
    }
  };

  const handleAddLinkClick = (sectionIndex: number) => {
    const textarea = descriptionRefs.current[sectionIndex];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Check if text is selected
    if (start === end) {
      alert("Nejprve označ text, který chceš převést na odkaz");
      return;
    }

    // Save selection and open dialog
    setSelectedText({ sectionIndex, start, end });
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!selectedText || !linkUrl.trim()) {
      alert("Vyber text a zadej URL");
      return;
    }

    const { sectionIndex, start, end } = selectedText;
    const section = formData.sections[sectionIndex];
    const before = section.description.substring(0, start);
    const selected = section.description.substring(start, end);
    const after = section.description.substring(end);

    // Create HTML link: <a href="url">text</a>
    const linkHtml = `<a href="${linkUrl}">${selected}</a>`;
    const newDescription = before + linkHtml + after;

    handleSectionChange(sectionIndex, "description", newDescription);
    setShowLinkDialog(false);
    setSelectedText(null);
    setLinkUrl("");

    // Restore focus to textarea
    setTimeout(() => {
      const textarea = descriptionRefs.current[sectionIndex];
      if (textarea) {
        const newCursorPos = start + linkHtml.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSave = async () => {
    // Validate that all sections have at least a title or description
    const hasEmptySections = formData.sections.some(
      (section) => !section.title.trim() && !section.description.trim()
    );
    
    if (hasEmptySections) {
      alert("Všechny sekce musí mít alespoň nadpis nebo popisek");
      return;
    }

    if (!formData.subject.trim()) {
      alert("Předmět emailu je povinný");
      return;
    }

    try {
      const url = editingCampaign
        ? `/api/admin/newsletter-campaigns/${editingCampaign.id}`
        : "/api/admin/newsletter-campaigns";
      
      const method = editingCampaign ? "PUT" : "POST";
      
      const body = {
        subject: formData.subject.trim(),
        description: formData.description || "",
        sections: formData.sections.filter(
          (section) => section.title.trim() || section.description.trim()
        ),
        scheduledAt: formData.scheduledAt || null,
      };

      console.log("Saving campaign:", body);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save campaign";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        console.error("Error response:", res.status, errorMessage);
        throw new Error(errorMessage);
      }

      await fetchCampaigns();
      setViewMode("list");
      setEditingCampaign(null);
      setFormData({ 
        subject: formData.subject, 
        description: formData.description, 
        sections: [{ title: "", description: "" }], 
        scheduledAt: "" 
      });
    } catch (err: any) {
      console.error("Error saving campaign:", err);
      alert(err.message || "Chyba při ukládání newsletteru");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chceš smazat tento newsletter?")) return;

    try {
      const res = await fetch(`/api/admin/newsletter-campaigns/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      await fetchCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert("Chyba při mazání newsletteru");
    }
  };

  const handleSend = async (id: string) => {
    setShowSendModal(true);
    setSendingCampaignId(id);
    setSendError(null);

    try {
      const res = await fetch("/api/admin/newsletter-campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send");
      }

      const data = await res.json();
      await fetchCampaigns();
      
      // Show success and close modal after delay
      setSendingCampaignId(null);
      setTimeout(() => {
        setShowSendModal(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error sending campaign:", err);
      setSendError(err.message || "Chyba při odesílání newsletteru");
      setSendingCampaignId(null);
    }
  };

  // Convert text with HTML links to properly formatted HTML
  const convertTextToHtml = (text: string): string => {
    // Extract and preserve HTML links BEFORE escaping
    const linkRegex = /<a\s+href=["']([^"']+)["']>([^<]+)<\/a>/gi;
    const links: Array<{ url: string; text: string; placeholder: string; fullMatch: string }> = [];
    let linkIndex = 0;
    
    // First pass: extract all links and replace with placeholders
    let processedText = text.replace(linkRegex, (match, url, linkText) => {
      const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`;
      links.push({ 
        url: url.trim(), 
        text: linkText.trim(), 
        placeholder,
        fullMatch: match
      });
      linkIndex++;
      return placeholder;
    });
    
    // Escape HTML entities in the remaining text (but not in placeholders)
    // We need to escape & first, then < and >
    processedText = processedText
      .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Restore links with proper styling (replace placeholders)
    links.forEach(({ url, text, placeholder }) => {
      // Escape URL if needed (but keep it as URL)
      const escapedUrl = url.replace(/&amp;/g, '&').replace(/&/g, '&amp;');
      const escapedText = text
        .replace(/&amp;/g, '&')
        .replace(/&/g, '&amp;')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      const linkHtml = `<a href="${escapedUrl}" style="color: #FF8C42; text-decoration: underline;">${escapedText}</a>`;
      processedText = processedText.replace(placeholder, linkHtml);
    });
    
    // Convert standalone URLs to links (only if not already in a link)
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      // Check if URL is already inside a link tag
      if (processedText.includes(`href="${url}"`) || processedText.includes(`href='${url}'`)) {
        return url;
      }
      // Don't convert if it's part of an escaped HTML tag
      if (processedText.includes(`&lt;a`) || processedText.includes(`&gt;`)) {
        return url;
      }
      return `<a href="${url}" style="color: #FF8C42; text-decoration: underline;">${url}</a>`;
    });
    
    // Convert line breaks
    processedText = processedText.replace(/\n\n/g, '</p><p style="margin: 16px 0;">');
    processedText = processedText.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!processedText.startsWith('<')) {
      processedText = `<p style="margin: 0 0 16px;">${processedText}</p>`;
    }
    
    return processedText;
  };

  const renderEmailPreview = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ziju.life';
    const unsubscribeUrl = `${siteUrl}/unsubscribe`;
    
    const sectionsHtml = formData.sections
      .filter((section) => section.title.trim() || section.description.trim())
      .map((section) => {
        const titleHtml = section.title.trim() 
          ? `<h2 style="color: #171717; font-size: 22px; font-weight: bold; margin: 0 0 12px; line-height: 1.3;">${section.title}</h2>`
          : '';
        const descriptionHtml = section.description.trim()
          ? `<div style="color: #171717; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${convertTextToHtml(section.description)}</div>`
          : '';
        
        return titleHtml + descriptionHtml;
      })
      .join('');
    
    const descriptionHtml = formData.description.trim()
      ? `<div style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px; font-style: italic;">${convertTextToHtml(formData.description)}</div>`
      : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #FDFDF7; font-family: Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FDFDF7;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #FDFDF7;">
                    <a href="${siteUrl}" style="display: inline-block; text-decoration: none; border: 0;">
                      <img src="${siteUrl}/ziju-life-logo.png" alt="Žiju life" width="200" height="80" style="max-width: 200px; width: 200px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
                    </a>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    ${descriptionHtml}
                    ${sectionsHtml || '<p style="color: #171717; font-size: 16px; line-height: 1.6;">Žádný obsah</p>'}
                    
                    <!-- Divider -->
                    <div style="height: 1px; background-color: #e5e5e5; margin: 30px 0;"></div>
                    
                    <!-- Closing -->
                    <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0;">
                      Matěj | Žiju life
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #FDFDF7; border-top: 1px solid #e5e5e5;">
                    <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Odhlásit se z odběru</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground/60">Načítání...</p>
      </div>
    );
  }

  if (viewMode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {editingCampaign ? "Upravit newsletter" : "Nový newsletter"}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={saveTemplate}
              className="px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
              title="Uložit šablonu předmětu a popisku"
            >
              Uložit šablonu
            </button>
            <button
              onClick={() => {
                setViewMode("preview");
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <Eye size={18} />
              Náhled
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
            >
              <Save size={18} />
              Uložit
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setEditingCampaign(null);
                loadTemplate();
                setFormData((prev) => ({
                  ...prev,
                  sections: [{ title: "", description: "" }],
                  scheduledAt: "",
                }));
              }}
              className="px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              Zrušit
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-black/5 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Předmět emailu (šablona)
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none"
              placeholder="Např. Co je u mě nového tento týden"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Popisek newsletteru (šablona)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none"
              placeholder="Krátký popisek, který se zobrazí pod předmětem..."
            />
            <p className="text-xs text-foreground/60 mt-1">
              Tento popisek se použije pro všechny nové newsletter campaigns. Ulož šablonu pro příště.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-foreground">
                Sekce newsletteru
              </label>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                <Plus size={16} />
                Přidat sekci
              </button>
            </div>

            <div className="space-y-4">
              {formData.sections.map((section, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-black/10 rounded-lg bg-white/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">
                      Sekce {index + 1}
                    </span>
                    {formData.sections.length > 1 && (
                      <button
                        onClick={() => handleRemoveSection(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Odebrat sekci"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1">
                        Nadpis sekce
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          handleSectionChange(index, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none text-sm"
                        placeholder="Např. 📚 Inspirace"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-foreground/70">
                          Popisek (označ text a klikni na odkaz pro přidání)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddLinkClick(index)}
                          className="flex items-center gap-1 px-2 py-1 text-xs border border-black/10 rounded hover:bg-black/5 transition-colors"
                          title="Označ text a klikni pro přidání odkazu"
                        >
                          <LinkIcon size={14} />
                          Přidat odkaz
                        </button>
                      </div>
                      <textarea
                        ref={(el) => {
                          descriptionRefs.current[index] = el;
                        }}
                        value={section.description}
                        onChange={(e) =>
                          handleSectionChange(index, "description", e.target.value)
                        }
                        onSelect={() => {
                          // Just track selection, don't open dialog
                          const textarea = descriptionRefs.current[index];
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            if (start !== end) {
                              setSelectedText({ sectionIndex: index, start, end });
                            }
                          }
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none text-sm"
                        placeholder="Popisek sekce... Označ text a klikni na 'Přidat odkaz' pro vložení odkazu."
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        Tip: Označ text, klikni na "Přidat odkaz" a vlož URL. Označený text zůstane zobrazený a bude klikatelný odkaz.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Naplánovat odeslání (volitelné)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              className="px-4 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none"
            />
            <p className="text-sm text-foreground/60 mt-2">
              Pokud vyplníš datum a čas, newsletter se automaticky odešle v tento čas všem odběratelům.
            </p>
          </div>
        </div>

        {/* Link Dialog */}
        {showLinkDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 border-2 border-black/10 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-foreground mb-4">Přidat odkaz</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    URL odkazu
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        insertLink();
                      }
                      if (e.key === "Escape") {
                        setShowLinkDialog(false);
                        setSelectedText(null);
                        setLinkUrl("");
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={insertLink}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Přidat odkaz
                  </button>
                  <button
                    onClick={() => {
                      setShowLinkDialog(false);
                      setSelectedText(null);
                      setLinkUrl("");
                    }}
                    className="px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "view") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Detail newsletteru</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (editingCampaign) {
                  handleDuplicateCampaign(editingCampaign);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <Copy size={18} />
              Duplikovat
            </button>
            <button
              onClick={() => {
                setViewMode("preview");
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <Eye size={18} />
              Náhled
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setEditingCampaign(null);
                setFormData({ subject: "", description: "", sections: [{ title: "", description: "" }], scheduledAt: "" });
              }}
              className="px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              Zpět na seznam
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-black/5 space-y-6">
          {editingCampaign && editingCampaign.status === "sent" && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCampaign.showOnBlog || false}
                  onChange={async (e) => {
                    try {
                      const res = await fetch(`/api/admin/newsletter-campaigns/${editingCampaign.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          subject: editingCampaign.subject,
                          description: editingCampaign.description,
                          sections: editingCampaign.sections,
                          scheduledAt: editingCampaign.scheduledAt?.toISOString(),
                          showOnBlog: e.target.checked,
                        }),
                      });
                      if (res.ok) {
                        await fetchCampaigns();
                        const updated = await res.json();
                        setEditingCampaign(updated);
                      }
                    } catch (err) {
                      console.error("Error updating showOnBlog:", err);
                      alert("Chyba při aktualizaci");
                    }
                  }}
                  className="w-5 h-5 text-accent border-black/20 rounded focus:ring-accent"
                />
                <span className="text-sm font-semibold text-foreground">
                  Zobrazit na blogu
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Předmět emailu
            </label>
            <div className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground">
              {formData.subject || "(bez předmětu)"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Popisek newsletteru
            </label>
            <div className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground min-h-[80px] whitespace-pre-wrap">
              {formData.description || "(bez popisku)"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-4">
              Sekce newsletteru
            </label>
            <div className="space-y-4">
              {formData.sections.map((section, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-black/10 rounded-lg bg-gray-50"
                >
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-foreground">
                      Sekce {index + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1">
                        Nadpis sekce
                      </label>
                      <div className="px-3 py-2 border border-black/10 rounded-lg bg-white text-sm">
                        {section.title || "(bez nadpisu)"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1">
                        Popisek
                      </label>
                      <div className="px-3 py-2 border border-black/10 rounded-lg bg-white text-sm min-h-[100px] whitespace-pre-wrap">
                        {section.description || "(bez popisku)"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Naplánováno
            </label>
            <div className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground">
              {formData.scheduledAt
                ? new Date(formData.scheduledAt).toLocaleString("cs-CZ")
                : "-"}
            </div>
          </div>

          {editingCampaign?.sentAt && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Odesláno
              </label>
              <div className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground">
                {new Date(editingCampaign.sentAt).toLocaleString("cs-CZ")}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "preview") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Náhled newsletteru</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode("edit")}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <Edit2 size={18} />
              Zpět na úpravu
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setEditingCampaign(null);
                loadTemplate();
                setFormData((prev) => ({
                  ...prev,
                  sections: [{ title: "", description: "" }],
                  scheduledAt: "",
                }));
              }}
              className="px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              Zrušit
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-black/5">
          <div className="mb-4">
            <p className="text-sm text-foreground/60 mb-1">Předmět:</p>
            <p className="font-semibold text-foreground">{formData.subject || "(bez předmětu)"}</p>
            {formData.description && (
              <>
                <p className="text-sm text-foreground/60 mb-1 mt-3">Popisek:</p>
                <p className="text-foreground/70 italic">{formData.description}</p>
              </>
            )}
          </div>
          
          <div className="border border-black/10 rounded-lg overflow-hidden">
            <iframe
              srcDoc={renderEmailPreview()}
              className="w-full h-[800px] border-0"
              title="Email preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Newsletter Campaigns</h1>
          <p className="text-foreground/70">Správa newsletterů</p>
        </div>
        <button
          onClick={handleNewCampaign}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={20} />
          Nový newsletter
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-black/5 text-center">
          <p className="text-foreground/60 mb-4">Zatím žádné newsletter campaigns</p>
          <button
            onClick={handleNewCampaign}
            className="px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
          >
            Vytvořit první newsletter
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50 border-b-2 border-black/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Předmět
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Naplánováno
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Odesláno
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-black/5 hover:bg-white/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground font-medium">
                      {campaign.status === "sent" && campaign.sentAt
                        ? `Newsletter - ${new Date(campaign.sentAt).toLocaleDateString("cs-CZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}`
                        : campaign.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status === "sent"
                            ? "bg-green-100 text-green-700"
                            : campaign.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {campaign.status === "sent"
                          ? "Odesláno"
                          : campaign.status === "scheduled"
                          ? "Naplánováno"
                          : "Koncept"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground/70">
                      {campaign.scheduledAt
                        ? new Date(campaign.scheduledAt).toLocaleString("cs-CZ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-foreground/70">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleString("cs-CZ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === "sent" ? (
                          <>
                            <button
                              onClick={() => handleViewCampaign(campaign)}
                              className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                              title="Zobrazit detail"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setShowDuplicateModal(true);
                                setDuplicatingCampaignId(campaign.id);
                                handleDuplicateCampaign(campaign);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Duplikovat"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Smazat"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSend(campaign.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Odeslat nyní"
                            >
                              <Send size={18} />
                            </button>
                            <button
                              onClick={() => handleEditCampaign(campaign)}
                              className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                              title="Upravit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Smazat"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send Newsletter Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 border-2 border-black/10 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Odesílání newsletteru</h3>
              {!sendingCampaignId && (
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSendError(null);
                  }}
                  className="p-1 hover:bg-black/5 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {sendingCampaignId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <p className="text-foreground">Odesílám newsletter všem odběratelům...</p>
                </div>
                {sendError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{sendError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <p className="text-foreground font-semibold">Newsletter byl úspěšně odeslán!</p>
                </div>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSendError(null);
                  }}
                  className="w-full px-4 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                >
                  Zavřít
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Newsletter Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 border-2 border-black/10 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Duplikování newsletteru</h3>
              {!duplicatingCampaignId && (
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateError(null);
                  }}
                  className="p-1 hover:bg-black/5 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {duplicatingCampaignId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <p className="text-foreground">Duplikuji newsletter...</p>
                </div>
                {duplicateError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{duplicateError}</p>
                    <button
                      onClick={() => {
                        setShowDuplicateModal(false);
                        setDuplicateError(null);
                        setDuplicatingCampaignId(null);
                      }}
                      className="mt-3 w-full px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
                    >
                      Zavřít
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <p className="text-foreground font-semibold">Newsletter byl úspěšně duplikován!</p>
                </div>
                <p className="text-sm text-foreground/70">
                  Nový newsletter je připraven k úpravě a má status "Koncept".
                </p>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateError(null);
                  }}
                  className="w-full px-4 py-2 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                >
                  Zavřít
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
