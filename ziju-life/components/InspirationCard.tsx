import Link from "next/link";
import { Book, Video, FileText, PenTool, HelpCircle, Music } from "lucide-react";
import type { InspirationItem } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "blog": return "Blog";
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
    case "music": return "Hudba";
    default: return type;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "blog": return PenTool;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    case "music": return Music;
    default: return FileText;
  }
};

function getVideoThumbnail(url: string): string | null {
  const youtubeMatch = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  return null;
}

interface InspirationCardProps {
  item: InspirationItem;
  index?: number;
}

export default function InspirationCard({ item, index = 0 }: InspirationCardProps) {
  const Icon = getTypeIcon(item.type);
  const videoThumbnail =
    item.type === "video"
      ? (item.thumbnail || getVideoThumbnail(item.url))
      : null;

  return (
    <Link
      href={`/inspirace/${item.id}`}
      className="block text-left w-full cursor-pointer"
    >
      <article
        className="bg-white/85 rounded-2xl p-4 border border-white/60 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 backdrop-blur space-y-3 h-full"
        style={{
          transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})`,
        }}
      >
        {item.type === "video" && videoThumbnail && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
            <img
              src={videoThumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-accent ml-1" />
              </div>
            </div>
          </div>
        )}
        {item.type === "book" && item.imageUrl && (
          <div className="w-full aspect-[2/3] max-h-48 rounded-xl overflow-hidden bg-gray-100 mb-4">
            <img
              src={item.imageUrl}
              alt={item.title}
              className={`w-full h-full ${item.bookCoverFit === "contain" ? "object-contain" : "object-cover"}`}
              style={
                item.bookCoverFit !== "contain"
                  ? { objectPosition: getBookCoverObjectPosition(item) }
                  : undefined
              }
            />
          </div>
        )}
        {item.type === "music" && (item.thumbnail || getVideoThumbnail(item.url)) && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
            <img
              src={item.thumbnail || getVideoThumbnail(item.url)!}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Music className="w-12 h-12 text-white" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Icon className="text-accent" size={18} />
          <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
            {getTypeLabel(item.type)}
          </span>
        </div>
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          {item.title}
        </h3>
        {item.author && (
          <p className="text-sm text-foreground/60">Autor: {item.author}</p>
        )}
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </article>
    </Link>
  );
}
