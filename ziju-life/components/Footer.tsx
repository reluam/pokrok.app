import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-black/10 bg-white/50 py-12 px-4 sm:px-6 lg:px-8 paper-texture">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold text-foreground mb-2">Žiju life</p>
            <p className="text-sm text-foreground/60">
              Dešifrujeme život za pochodu
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Link href="/inspirace" className="text-sm text-foreground/70 hover:text-accent transition-colors">
              Inspirace
            </Link>
            <a
              href="https://www.skool.com/ziju-life-9405"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground/70 hover:text-accent transition-colors"
            >
              Komunita
            </a>
            <Link href="/o-mne" className="text-sm text-foreground/70 hover:text-accent transition-colors">
              O mně
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-black/5 text-center">
          <p className="text-sm text-foreground/60">
            © {new Date().getFullYear()} Žiju life. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  );
}
