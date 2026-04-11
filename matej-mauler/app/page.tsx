/* ─── Data ─── */

const projects = [
  {
    name: "Žiju.life",
    description:
      "Můj nejdůležitější projekt. Aplikace, web a nástroje pro vědomější každodennost. Buduju to s týmem už nějaký ten rok.",
    href: "https://ziju.life",
    label: "App · Web · Komunita",
  },
  {
    name: "Matějův zápisník",
    description:
      "Píšu na Substacku o věcech, které mě právě teď zajímají — vědomí, žití, drobné objevy. Občas dlouho, občas krátce. Nikdy ne nuceně.",
    href: "#",
    label: "Substack",
  },
];

const socials = [
  {
    name: "Instagram",
    handle: "@zijulife",
    href: "https://instagram.com/zijulife",
    icon: "instagram",
  },
  {
    name: "Substack",
    handle: "Matějův zápisník",
    href: "#",
    icon: "article",
  },
  {
    name: "E-mail",
    handle: "matej@matejmauler.com",
    href: "mailto:matej@matejmauler.com",
    icon: "mail",
  },
  {
    name: "Žiju.life",
    handle: "ziju.life",
    href: "https://ziju.life",
    icon: "globe",
  },
];

/* ─── Icon ─── */

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
    case "arrow_upward":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M12 19V5M5 12l7-7 7 7" />
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
    case "mail":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 5L2 7" />
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
    default:
      return null;
  }
}

/* ─── Page ─── */

export default function Home() {
  return (
    <main className="flex-1 bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <section
          className="text-center mb-20 md:mb-24 animate-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          {/* Avatar placeholder */}
          <div className="w-28 h-28 mx-auto mb-10 rounded-full bg-surface-mid flex items-center justify-center editorial-shadow">
            <span className="font-display text-3xl font-bold text-outline-variant">
              MM
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-[4.5rem] font-extrabold leading-[0.95] tracking-tight mb-8">
            Ahoj, jsem
            <br />
            <span className="italic font-display">Matěj</span>.
          </h1>

          <p className="text-lg md:text-xl text-on-surface-muted leading-relaxed max-w-lg mx-auto mb-5">
            Tvořím{" "}
            <a
              href="https://ziju.life"
              className="text-primary underline decoration-primary/30 decoration-2 underline-offset-4 hover:decoration-primary transition-colors"
            >
              Žiju.life
            </a>
            , píšu na Substack a snažím se přijít na to, jak žít vědoměji.
          </p>

          <p className="text-base text-on-surface-muted/70 max-w-md mx-auto">
            Tahle stránka je rozcestník — najdeš tady všechno, co dělám.
          </p>
        </section>

        {/* Co teď dělám */}
        <section
          className="mb-20 md:mb-24 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-label text-[0.7rem] uppercase tracking-[0.2em] text-primary font-medium mb-3">
              Co teď dělám
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Moje projekty
            </h2>
          </div>

          <div className="space-y-4">
            {projects.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-surface-low rounded-2xl p-7 md:p-8 hover:bg-surface-mid transition-colors group"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h3 className="font-display text-xl md:text-2xl font-bold">
                    {p.name}
                  </h3>
                  <span className="text-primary group-hover:translate-x-1 transition-transform shrink-0">
                    <Icon name="arrow_forward" size={22} />
                  </span>
                </div>
                <p className="text-on-surface-muted leading-relaxed mb-4">
                  {p.description}
                </p>
                <p className="font-label text-[0.7rem] uppercase tracking-[0.15em] text-primary font-medium">
                  {p.label}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Kde mě najdeš */}
        <section
          className="mb-16 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-label text-[0.7rem] uppercase tracking-[0.2em] text-primary font-medium mb-3">
              Sleduj mě
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Kde mě najdeš
            </h2>
          </div>

          <div className="space-y-3">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-surface-low rounded-2xl px-5 py-4 hover:bg-surface-mid transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name={s.icon} size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-base">{s.name}</p>
                  <p className="text-sm text-on-surface-muted truncate">
                    {s.handle}
                  </p>
                </div>
                <span className="text-on-surface-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">
                  <Icon name="arrow_forward" size={18} />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-outline-variant/20">
          <p className="text-sm text-on-surface-muted/60 mt-8">
            &copy; 2026 Matěj Mauler &middot; vyrobeno s láskou
          </p>
        </footer>
      </div>
    </main>
  );
}
