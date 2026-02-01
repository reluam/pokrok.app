"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Book, Video, FileText, PenTool, HelpCircle, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InspirationItem } from "@/lib/inspiration";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "blog": return PenTool;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    default: return FileText;
  }
};

const getVideoId = (url: string): string | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return vimeoMatch[1];
  
  return null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes("vimeo.com")) {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  
  return null;
};

const getVideoThumbnail = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  if (url.includes("vimeo.com")) {
    return null; // Vimeo requires API call for thumbnail
  }
  
  return null;
};

export default function InspiraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InspirationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin' | 'copy') => {
    if (!item) return;

    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const title = encodeURIComponent(item.title || '');
    const text = encodeURIComponent(item.description || '');

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${title}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const res = await fetch("/api/inspiration");
      const data = await res.json();
      
      const allItems = [
        ...data.blogs,
        ...data.videos,
        ...data.books,
        ...data.articles,
        ...data.other,
      ].filter((i: InspirationItem) => i.isActive !== false); // Only show active items
      
      const foundItem = allItems.find((i: InspirationItem) => i.id === params.id);
      setItem(foundItem || null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching item:", error);
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

  if (!item) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-foreground/60 mb-4">Článek nenalezen</p>
          <button
            onClick={() => router.push("/blog")}
            className="px-6 py-3 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
          >
            Zpět na blog
          </button>
        </div>
      </main>
    );
  }

  const Icon = getTypeIcon(item.type);
  const videoEmbedUrl = item.type === "video" ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail = item.type === "video" && !videoEmbedUrl ? (item.thumbnail || getVideoThumbnail(item.url)) : null;

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigace zpět */}
        <button
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Zpět na blog</span>
        </button>

        <div className="flex items-center gap-3">
          <Icon className="text-accent" size={24} />
          <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full">
            {item.type === "blog" ? "Blog" : 
             item.type === "video" ? "Video" : 
             item.type === "book" ? "Kniha" : 
             item.type === "article" ? "Článek" : "Ostatní"}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground">{item.title}</h1>

        {item.author && (
          <p className="text-lg text-foreground/60">Autor: {item.author}</p>
        )}

        {/* Popisek - odděleně pro blog */}
        {item.type === "blog" && item.description && (
          <p className="text-lg text-foreground/80 leading-relaxed pb-6 border-b border-black/10">
            {item.description}
          </p>
        )}

        {/* Popisek - pro ostatní typy */}
        {item.type !== "blog" && item.description && (
          <p className="text-lg text-foreground/80 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Video Embed */}
        {item.type === "video" && videoEmbedUrl && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe
              src={videoEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Video Thumbnail Link */}
        {item.type === "video" && !videoEmbedUrl && videoThumbnail && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full aspect-video rounded-2xl overflow-hidden bg-black group"
          >
            <img
              src={videoThumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-accent ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </a>
        )}

        {/* Video Direct Link */}
        {item.type === "video" && !videoEmbedUrl && !videoThumbnail && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
          >
            Otevřít video →
          </a>
        )}

        {/* Blog Content */}
        {item.type === "blog" && item.content && (
          <div className="blog-detail-content max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sdílení - pouze pro blog, pod článkem */}
        {item.type === "blog" && (
          <div className="flex items-center gap-4 pt-6 border-t border-black/10">
            <span className="text-sm text-foreground/60 font-semibold">Sdílet:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="Sdílet na Facebooku"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="Sdílet na Twitteru"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="Sdílet na LinkedInu"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="p-2 rounded-full hover:bg-accent/10 transition-colors"
                aria-label="Kopírovat odkaz"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-accent" />
                ) : (
                  <Copy className="w-5 h-5 text-foreground/70" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* External Link */}
        {item.type !== "blog" && item.type !== "video" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
          >
            Otevřít →
          </a>
        )}
      </div>
    </main>
  );
}
