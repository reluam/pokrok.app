"use client";

export function CompletionScreen({ emoji, title, summary, onGoPrehled, onEdit }: {
  emoji: string;
  title: string;
  summary: React.ReactNode;
  onGoPrehled: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="text-6xl">{emoji}</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground">{title}</h2>
      </div>
      <div className="bg-white border border-black/8 rounded-[24px] px-6 py-5 text-left">
        {summary}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoPrehled}
          className="px-7 py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors shadow-md"
        >
          Pokračovat na přehled →
        </button>
        <button
          onClick={onEdit}
          className="px-7 py-3 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          Upravit odpovědi
        </button>
      </div>
    </div>
  );
}
