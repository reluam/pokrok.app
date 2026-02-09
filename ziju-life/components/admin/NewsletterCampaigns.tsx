"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, Eye, Send, Save, X, Link as LinkIcon, Copy, Loader2, Bold, Italic, Heading2, Quote, FileText } from "lucide-react";
import type { NewsletterCampaign, NewsletterTemplate } from "@/lib/newsletter-campaigns-db";
import type { InspirationItem, InspirationData } from "@/lib/inspiration";

type ViewMode = "list" | "edit" | "preview" | "view";

const TEMPLATE_STORAGE_KEY = "newsletter_template";

export default function NewsletterCampaigns() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    sender: "Matěj Mauler <matej@mail.ziju.life>",
    body: "",
    scheduledAt: "",
  });
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [articles, setArticles] = useState<InspirationItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [duplicatingCampaignId, setDuplicatingCampaignId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const bodyEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCampaigns();
    loadTemplate();
  }, []);

  // Sync editor content with formData when switching to edit mode
  useEffect(() => {
    if (viewMode === "edit" && bodyEditorRef.current) {
      // Set editor content from formData when entering edit mode
      // Use a small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (bodyEditorRef.current) {
          const currentEditorContent = bodyEditorRef.current.innerHTML;
          const formDataContent = formData.body || "";
          
          // Only update if formData has content and editor content is different
          if (formDataContent && currentEditorContent !== formDataContent) {
            bodyEditorRef.current.innerHTML = formDataContent;
          }
        }
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [viewMode]);

  const loadTemplate = () => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        const template: NewsletterTemplate = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          subject: template.subject || "",
          sender: template.sender || "Matěj Mauler <matej@mail.ziju.life>",
          body: template.body || "",
        }));
        
        // Set body editor content after render
        setTimeout(() => {
          if (bodyEditorRef.current && template.body) {
            bodyEditorRef.current.innerHTML = template.body;
          }
        }, 10);
      }
    } catch (err) {
      console.error("Error loading template:", err);
    }
  };

  const saveTemplate = () => {
    try {
      // Get current body content from editor
      const bodyContent = bodyEditorRef.current?.innerHTML || formData.body || "";
      
      const template: NewsletterTemplate = {
        subject: formData.subject,
        sender: formData.sender,
        body: bodyContent,
      };
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
      alert("Šablona newsletteru uložena!");
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
    setFormData({
      subject: "",
      sender: "Matěj Mauler <matej@mail.ziju.life>",
      body: "",
      scheduledAt: "",
    });
    setViewMode("edit");
    // Load template after setting view mode (will populate formData and editor)
    setTimeout(() => {
      loadTemplate();
    }, 10);
  };

  const handleEditCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      subject: campaign.subject,
      sender: campaign.sender || "Matěj Mauler <matej@mail.ziju.life>",
      body: campaign.body || "",
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setViewMode("edit");
    // Set body editor content after render
    setTimeout(() => {
      if (bodyEditorRef.current) {
        bodyEditorRef.current.innerHTML = campaign.body || "";
      }
    }, 0);
  };

  const handleViewCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      subject: campaign.subject,
      sender: campaign.sender || "Matěj Mauler <matej@mail.ziju.life>",
      body: campaign.body || "",
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
          sender: campaign.sender || "Matěj Mauler <matej@mail.ziju.life>",
          body: campaign.body || "",
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

  // Rich text editor functions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (bodyEditorRef.current) {
      setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
    }
  };

  const handleFormatHeading = () => {
    execCommand('formatBlock', '<h2>');
  };

  const handleFormatBold = () => {
    execCommand('bold');
  };

  const handleFormatItalic = () => {
    execCommand('italic');
  };

  const handleFormatQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      
      if (selectedText) {
        // Wrap selected text in blockquote
        const blockquote = document.createElement('blockquote');
        blockquote.style.cssText = 'border-left: 4px solid #FF8C42; padding: 6px 16px; margin: 16px 0; color: #666; font-style: italic; background-color: #FFF5ED;';
        blockquote.textContent = selectedText;
        range.deleteContents();
        range.insertNode(blockquote);
        
        // Update form data
        if (bodyEditorRef.current) {
          setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
        }
      } else {
        // If no selection, insert empty blockquote at cursor
        const blockquote = document.createElement('blockquote');
        blockquote.style.cssText = 'border-left: 4px solid #FF8C42; padding: 6px 16px; margin: 16px 0; color: #666; font-style: italic; background-color: #FFF5ED;';
        blockquote.innerHTML = '<br>';
        range.insertNode(blockquote);
        
        // Move cursor inside blockquote
        const newRange = document.createRange();
        newRange.setStart(blockquote, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update form data
        if (bodyEditorRef.current) {
          setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
        }
      }
    }
    
    // Restore focus
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
    }
  };

  const handleAddLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      alert("Nejprve označ text, který chceš převést na odkaz");
      return;
    }
    
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      alert("Nejprve označ text, který chceš převést na odkaz");
      return;
    }
    
    // Save the selection range before opening dialog
    const range = selection.getRangeAt(0).cloneRange();
    setSavedSelection(range);
    setShowLinkDialog(true);
  };

  const handleAddArticle = async () => {
    setShowArticleDialog(true);
    setLoadingArticles(true);
    
    try {
      const res = await fetch("/api/inspiration");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data: InspirationData = await res.json();
      
      // Combine all article types
      const allArticles: InspirationItem[] = [
        ...(data.blogs || []),
        ...(data.articles || []),
        ...(data.videos || []),
        ...(data.books || []),
        ...(data.other || []),
      ].filter(item => item.isActive !== false); // Only active items
      
      // Sort by creation date (newest first)
      allArticles.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setArticles(allArticles);
    } catch (err) {
      console.error("Error fetching articles:", err);
      alert("Chyba při načítání článků");
    } finally {
      setLoadingArticles(false);
    }
  };

  const insertArticle = (article: InspirationItem) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ziju.life';
    
    // For blog type articles, generate URL from ID if no URL exists
    let articleUrl: string;
    if (article.type === 'blog' && !article.url) {
      articleUrl = `${siteUrl}/blog/${article.id}`;
    } else if (!article.url) {
      alert("Článek nemá URL");
      return;
    } else {
      articleUrl = article.url.startsWith('http') ? article.url : `${siteUrl}${article.url}`;
    }
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Create a link element with article title
      const link = document.createElement('a');
      link.href = articleUrl;
      link.textContent = article.title || 'Článek';
      link.style.cssText = 'color: #FF8C42; text-decoration: underline;';
      
      // Insert link at cursor position
      range.insertNode(link);
      
      // Move cursor after the link
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Update form data
      if (bodyEditorRef.current) {
        setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
      }
    } else {
      // If no selection, insert at end of editor
      if (bodyEditorRef.current) {
        const link = document.createElement('a');
        link.href = articleUrl;
        link.textContent = article.title || 'Článek';
        link.style.cssText = 'color: #FF8C42; text-decoration: underline;';
        
        bodyEditorRef.current.appendChild(link);
        bodyEditorRef.current.appendChild(document.createTextNode(' '));
        
        setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
      }
    }
    
    setShowArticleDialog(false);
    
    // Restore focus
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
    }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      alert("Zadej URL");
      return;
    }

    if (!savedSelection || !bodyEditorRef.current) {
      alert("Chyba: výběr textu byl ztracen");
      setShowLinkDialog(false);
      setLinkUrl("");
      return;
    }

    try {
      // Restore selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        const selectedText = selection.toString();
        if (selectedText) {
          const link = document.createElement('a');
          link.href = linkUrl;
          link.textContent = selectedText;
          link.style.cssText = 'color: #FF8C42; text-decoration: underline;';
          
          savedSelection.deleteContents();
          savedSelection.insertNode(link);
          
          // Move cursor after the link
          const newRange = document.createRange();
          newRange.setStartAfter(link);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Update form data
          setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
        }
      }
    } catch (error) {
      console.error("Error inserting link:", error);
      alert("Chyba při vkládání odkazu");
    }
    
    setShowLinkDialog(false);
    setLinkUrl("");
    setSavedSelection(null);
    
    // Restore focus
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
    }
  };

  const handleBodyChange = () => {
    if (bodyEditorRef.current) {
      setFormData({ ...formData, body: bodyEditorRef.current.innerHTML });
    }
  };

  const handleSave = async () => {
    if (!formData.subject.trim()) {
      alert("Předmět emailu je povinný");
      return;
    }

    if (!formData.sender.trim()) {
      alert("Odesílatel je povinný");
      return;
    }

    // Get body content from editor
    const bodyContent = bodyEditorRef.current?.innerHTML || formData.body || "";

    if (!bodyContent.trim()) {
      alert("Tělo emailu je povinné");
      return;
    }

    try {
      const url = editingCampaign
        ? `/api/admin/newsletter-campaigns/${editingCampaign.id}`
        : "/api/admin/newsletter-campaigns";
      
      const method = editingCampaign ? "PUT" : "POST";
      
      const body = {
        subject: formData.subject.trim(),
        sender: formData.sender.trim(),
        body: bodyContent,
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
        subject: "", 
        sender: "Matěj Mauler <matej@mail.ziju.life>",
        body: "", 
        scheduledAt: "" 
      });
      if (bodyEditorRef.current) {
        bodyEditorRef.current.innerHTML = "";
      }
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


  const renderEmailPreview = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ziju.life';
    const unsubscribeUrl = `${siteUrl}/unsubscribe`;
    
    // Get body content from editor
    const bodyContent = bodyEditorRef.current?.innerHTML || formData.body || '';
    
    // Ensure links have proper styling - always use orange color
    let bodyHtml = bodyContent.replace(
      /<a\s+href=["']([^"']+)["']([^>]*)>([^<]+)<\/a>/gi,
      (match, url, attrs, text) => {
        // Remove existing color styles and add orange
        const cleanAttrs = attrs ? attrs.replace(/style=["'][^"']*color[^"']*["']/gi, '').replace(/style=["']([^"']*)["']/gi, (_m: string, styles: string) => {
          return styles ? `style="${styles}"` : '';
        }) : '';
        return `<a href="${url}" style="color: #FF8C42 !important; text-decoration: underline;"${cleanAttrs}>${text}</a>`;
      }
    );
    
    // Ensure blockquotes have proper styling - always match editor
    bodyHtml = bodyHtml.replace(
      /<blockquote([^>]*)>/gi,
      (match, attrs) => {
        // Always apply consistent styling
        return `<blockquote style="border-left: 4px solid #FF8C42 !important; padding: 6px 16px !important; margin: 16px 0 !important; color: #666 !important; font-style: italic !important; background-color: #FFF5ED !important;"${attrs || ''}>`;
      }
    );
    
    const bodyContentHtml = bodyHtml.trim()
      ? `<div style="color: #171717; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${bodyHtml}</div>`
      : '<p style="color: #171717; font-size: 16px; line-height: 1.6;">Žádný obsah</p>';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Ensure links are orange */
          a {
            color: #FF8C42 !important;
            text-decoration: underline;
          }
          a:hover {
            color: #e67a2e !important;
          }
          /* Ensure blockquotes match editor styling */
          blockquote {
            border-left: 4px solid #FF8C42 !important;
            padding: 6px 16px !important;
            margin: 16px 0 !important;
            color: #666 !important;
            font-style: italic !important;
            background-color: #FFF5ED !important;
          }
        </style>
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
                    ${bodyContentHtml}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #FDFDF7; border-top: 1px solid #e5e5e5;">
                    <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      <a href="${unsubscribeUrl}" style="color: #FF8C42 !important; text-decoration: underline;">Odhlásit se z odběru</a>
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
              title="Uložit šablonu newsletteru (předmět, odesílatel, tělo)"
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
              Předmět emailu
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
              Odesílatel
            </label>
            <input
              type="text"
              value={formData.sender}
              onChange={(e) =>
                setFormData({ ...formData, sender: e.target.value })
              }
              className="w-full px-4 py-2 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none"
              placeholder="Matěj Mauler <matej@mail.ziju.life>"
            />
            <p className="text-xs text-foreground/60 mt-1">
              Formát: Jméno &lt;email@example.com&gt;
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tělo emailu
            </label>
            
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-2 p-2 border border-black/10 rounded-lg bg-gray-50">
              <button
                type="button"
                onClick={handleFormatHeading}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Nadpis"
              >
                <Heading2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleFormatBold}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Tučné"
              >
                <Bold size={18} />
              </button>
              <button
                type="button"
                onClick={handleFormatItalic}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Kurzíva"
              >
                <Italic size={18} />
              </button>
              <button
                type="button"
                onClick={handleFormatQuote}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Citát"
              >
                <Quote size={18} />
              </button>
              <div className="w-px h-6 bg-black/10 mx-1" />
              <button
                type="button"
                onClick={handleAddLink}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Přidat odkaz"
              >
                <LinkIcon size={18} />
              </button>
              <button
                type="button"
                onClick={handleAddArticle}
                className="p-2 hover:bg-white rounded transition-colors"
                title="Vložit článek"
              >
                <FileText size={18} />
              </button>
            </div>

            {/* Rich text editor */}
            <div
              ref={bodyEditorRef}
              contentEditable
              onInput={handleBodyChange}
              onBlur={handleBodyChange}
              className="w-full min-h-[400px] px-4 py-3 border border-black/10 rounded-lg focus:border-accent focus:ring-accent focus:outline-none text-sm bg-white"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              suppressContentEditableWarning
            />
            <style jsx global>{`
              [contenteditable] blockquote {
                border-left: 4px solid #FF8C42;
                padding: 6px 16px;
                margin: 16px 0;
                color: #666;
                font-style: italic;
                background-color: #FFF5ED;
              }
              [contenteditable] a {
                color: #FF8C42;
                text-decoration: underline;
              }
            `}</style>
            <p className="text-xs text-foreground/60 mt-1">
              Tip: Označ text a použij tlačítka pro formátování. Pro odkaz označ text a klikni na ikonu odkazu.
            </p>
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
                        setLinkUrl("");
                        setSavedSelection(null);
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
                      setLinkUrl("");
                      setSavedSelection(null);
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

        {/* Article Dialog */}
        {showArticleDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 border-2 border-black/10 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Vložit článek</h3>
                <button
                  onClick={() => {
                    setShowArticleDialog(false);
                    setArticles([]);
                  }}
                  className="p-1 hover:bg-black/5 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {loadingArticles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <span className="ml-3 text-foreground/60">Načítání článků...</span>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  Žádné články k dispozici
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => insertArticle(article)}
                      className="w-full text-left p-4 border border-black/10 rounded-lg hover:border-accent hover:bg-accent/5 transition-colors"
                    >
                      <div className="font-semibold text-foreground mb-1">{article.title}</div>
                      {article.description && (
                        <div className="text-sm text-foreground/60 line-clamp-2">{article.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-foreground/40">
                        <span className="px-2 py-1 bg-black/5 rounded">{article.type}</span>
                        {article.author && <span>• {article.author}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                setFormData({ subject: "", sender: "Matěj Mauler <matej@mail.ziju.life>", body: "", scheduledAt: "" });
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
                          sender: editingCampaign.sender,
                          body: editingCampaign.body,
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
              Odesílatel
            </label>
            <div className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground">
              {formData.sender || "(bez odesílatele)"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tělo emailu
            </label>
            <div 
              className="px-4 py-2 border border-black/10 rounded-lg bg-gray-50 text-foreground min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: editingCampaign?.body || formData.body || "(bez obsahu)" }}
            />
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
              onClick={() => {
                // Restore editor content from formData when switching back to edit
                setViewMode("edit");
                setTimeout(() => {
                  if (bodyEditorRef.current && formData.body) {
                    bodyEditorRef.current.innerHTML = formData.body;
                  }
                }, 0);
              }}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Na blogu
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
                    <td className="px-6 py-4">
                      {campaign.status === "sent" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={campaign.showOnBlog || false}
                            onChange={async (e) => {
                              try {
                                const res = await fetch(`/api/admin/newsletter-campaigns/${campaign.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    subject: campaign.subject,
                                    sender: campaign.sender,
                                    body: campaign.body,
                                    scheduledAt: campaign.scheduledAt?.toISOString(),
                                    showOnBlog: e.target.checked,
                                  }),
                                });
                                if (res.ok) {
                                  await fetchCampaigns();
                                } else {
                                  alert("Chyba při aktualizaci");
                                }
                              } catch (err) {
                                console.error("Error updating showOnBlog:", err);
                                alert("Chyba při aktualizaci");
                              }
                            }}
                            className="w-4 h-4 text-accent border-black/20 rounded focus:ring-accent cursor-pointer"
                          />
                          <span className="text-sm text-foreground">
                            {campaign.showOnBlog ? "Ano" : "Ne"}
                          </span>
                        </label>
                      ) : (
                        <span className="text-foreground/40 text-xs">-</span>
                      )}
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
