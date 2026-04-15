import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle py-xl">
      <div className="container-lg">
        <div className="flex flex-col items-center justify-between gap-lg md:flex-row">
          <div className="flex items-center gap-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mascot.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-md font-extrabold text-ink-primary">Calibrate</span>
            <span className="text-xs text-ink-muted">
              © {new Date().getFullYear()} Smysluplne ziti
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-lg text-sm font-semibold text-ink-secondary">
            <Link href="/login" className="transition-colors hover:text-primary">
              Přihlásit se
            </Link>
            <a
              href="https://ziju.life"
              className="transition-colors hover:text-primary"
            >
              ziju.life
            </a>
            <a
              href="mailto:ahoj@ziju.life"
              className="transition-colors hover:text-primary"
            >
              Kontakt
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
