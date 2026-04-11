import fs from "node:fs";
import path from "node:path";

const hasAvatar = fs.existsSync(
  path.join(process.cwd(), "public", "matej.jpg")
);

/* ─── Data ─── */

type Link = { name: string; handle: string; href: string; icon: string };

type Project = {
  name: string;
  tagline: string;
  description: string;
  color: "primary" | "teal" | "lavender";
  emoji: string;
  comingSoon?: boolean;
  links: Link[];
};

const projects: Project[] = [
  {
    name: "Žiju.life",
    tagline: "Můj hlavní projekt",
    description:
      "Aplikace, web a nástroje pro vědomější každodennost. Buduju to s týmem už nějaký ten rok.",
    color: "primary",
    emoji: "🌱",
    links: [
      {
        name: "Web",
        handle: "ziju.life",
        href: "https://ziju.life",
        icon: "globe",
      },
      {
        name: "Instagram",
        handle: "@zijulife",
        href: "https://www.instagram.com/zijulife/",
        icon: "instagram",
      },
      {
        name: "YouTube",
        handle: "@zijulife",
        href: "https://www.youtube.com/@zijulife",
        icon: "youtube",
      },
      {
        name: "Facebook",
        handle: "Žiju.life",
        href: "https://www.facebook.com/zijulife",
        icon: "facebook",
      },
    ],
  },
  {
    name: "Snaps",
    tagline: "Něco nového",
    description:
      "Pracuju na něčem novém. Brzy se dozvíš víc. Zatím jen tolik — bude to dobré.",
    color: "lavender",
    emoji: "📸",
    comingSoon: true,
    links: [],
  },
  {
    name: "Matějův zápisník",
    tagline: "Substack",
    description:
      "Píšu o věcech, které mě právě teď zajímají — vědomí, žití, drobné objevy. Občas dlouho, občas krátce. Nikdy ne nuceně.",
    color: "teal",
    emoji: "✍️",
    links: [
      {
        name: "Substack",
        handle: "reluam.substack.com",
        href: "https://reluam.substack.com/",
        icon: "article",
      },
    ],
  },
];

/* ─── Icons ─── */

function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const s = { width: size, height: size };
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "arrow_forward":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "article":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "globe":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 5L2 7" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Color helpers ─── */

const colorMap = {
  primary: {
    bg: "bg-[#fff4eb]",
    text: "text-[#ff8c42]",
    border: "border-[#ffb380]",
    iconBg: "bg-[#ffe4cc]",
  },
  teal: {
    bg: "bg-[#e8faf8]",
    text: "text-[#2ba89e]",
    border: "border-[#8be0d8]",
    iconBg: "bg-[#c6f1ec]",
  },
  lavender: {
    bg: "bg-[#f1eefc]",
    text: "text-[#7766d8]",
    border: "border-[#cdc4f5]",
    iconBg: "bg-[#dfd8fa]",
  },
};

/* ─── Page ─── */

export default function Home() {
  return (
    <main className="flex-1 bg-background overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        {/* ─── Hero ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up relative"
          style={{ animationDelay: "0ms" }}
        >
          {/* Floating decorative emoji */}
          <div className="absolute -top-4 -left-2 text-3xl animate-float opacity-60 hidden md:block">
            ✨
          </div>
          <div
            className="absolute top-10 -right-4 text-2xl animate-float opacity-50 hidden md:block"
            style={{ animationDelay: "1.5s" }}
          >
            🌿
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-start">
            {/* Avatar — square paper-card style — nahraj svou fotku jako /public/matej.jpg */}
            <div className="paper-card overflow-hidden w-56 h-56 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0">
              {hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/matej.jpg"
                  alt="Matěj Mauler"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ffe4cc] to-[#c6f1ec] flex items-center justify-center">
                  <span className="font-display text-5xl font-extrabold text-[#ff6b1a]">
                    MM
                  </span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1] mb-5 tracking-tight">
                Ahoj, jsem{" "}
                <span className="underline-playful">Matěj</span>
                <span className="text-primary">.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-3">
                Tvořím{" "}
                <a
                  href="https://ziju.life"
                  className="font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Žiju.life
                </a>
                , píšu na Substack a dělám pár dalších věcí. Pořád zkouším
                přijít na to, jak žít vědoměji.
              </p>

              <p className="text-base text-muted">
                Tahle stránka je{" "}
                <span className="underline-teal font-semibold">rozcestník</span>{" "}
                — najdeš tady všechno, co dělám.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Co teď dělám ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              ⚡ Co teď dělám
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Moje{" "}
              <span className="underline-playful">projekty</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => {
              const c = colorMap[p.color];
              return (
                <div
                  key={p.name}
                  className="paper-card p-6 h-full flex flex-col relative"
                >
                  {p.comingSoon && (
                    <span className="badge-soon absolute -top-2 -right-2">
                      <Icon name="sparkles" size={12} />
                      Coming soon
                    </span>
                  )}

                  <div
                    className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center mb-4 text-2xl`}
                  >
                    {p.emoji}
                  </div>

                  <p
                    className={`font-display text-[0.7rem] uppercase tracking-[0.15em] font-bold mb-1 ${c.text}`}
                  >
                    {p.tagline}
                  </p>
                  <h3 className="font-display text-2xl font-extrabold mb-3">
                    {p.name}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed text-[0.95rem] mb-5 flex-1">
                    {p.description}
                  </p>

                  {p.links.length === 0 ? (
                    <p className="text-muted text-sm italic">
                      Až bude něco veřejně, najdeš to tady jako první.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {p.links.map((l) => (
                        <a
                          key={l.name}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${c.bg} hover:scale-[1.02] transition-transform`}
                        >
                          <span className={c.text}>
                            <Icon name={l.icon} size={18} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-display font-bold text-sm leading-tight ${c.text}`}
                            >
                              {l.name}
                            </p>
                            <p className="text-xs text-foreground/50 truncate">
                              {l.handle}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Napsat ─── */}
        <section
          className="text-center mb-12 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="paper-card p-8">
            <p className="text-2xl mb-3">👋</p>
            <h3 className="font-display text-xl font-extrabold mb-2">
              Chceš mi napsat?
            </h3>
            <p className="text-muted text-sm mb-5">
              Nejjednodušší cesta je e-mail.
            </p>
            <a href="mailto:matej@matejmauler.com" className="btn-playful">
              <Icon name="mail" size={18} />
              matej@matejmauler.com
            </a>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="text-center pt-6">
          <p className="text-xs text-muted/60 font-display">
            &copy; 2026 Matěj Mauler
          </p>
        </footer>
      </div>
    </main>
  );
}
