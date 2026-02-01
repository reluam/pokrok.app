"use client";

import { useEffect } from "react";
import { X, Book, Video, FileText, PenTool, HelpCircle } from "lucide-react";
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

interface InspirationModalProps {
  item: InspirationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InspirationModal({ item, isOpen, onClose }: InspirationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const Icon = getTypeIcon(item.type);
  const videoEmbedUrl = item.type === "video" ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail = item.type === "video" && !videoEmbedUrl ? (item.thumbnail || getVideoThumbnail(item.url)) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
          aria-label="Zavřít"
        >
          <X size={24} className="text-foreground" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Icon className="text-accent" size={24} />
            <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full">
              {item.type === "blog" ? "Blog" : 
               item.type === "video" ? "Video" : 
               item.type === "book" ? "Kniha" : 
               item.type === "article" ? "Článek" : "Ostatní"}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground pr-12">
            {item.title}
          </h1>

          {item.author && (
            <p className="text-lg text-foreground/60">Autor: {item.author}</p>
          )}

          {/* Popisek - odděleně pro blog */}
          {item.type === "blog" && item.description && (
            <>
              <p className="text-lg text-foreground/80 leading-relaxed pb-6 border-b border-black/10">
                {item.description}
              </p>
            </>
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

          {/* Blog Content */}
          {item.type === "blog" && item.content && (
            <div className="prose prose-lg max-w-none pt-6">
              <div className="blog-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.content}
                </ReactMarkdown>
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

          {/* Video Direct Link (if no embed or thumbnail) */}
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
        </div>
      </div>
    </div>
  );
}
