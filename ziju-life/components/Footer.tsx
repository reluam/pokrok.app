import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import Certificates from "./Certificates";

export default function Footer() {
  return (
    <>
      <footer className="border-t-2 border-black/10 bg-white/50 py-12 px-4 sm:px-6 lg:px-8 paper-texture">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="mb-2">
                <Image
                  src="/ziju-life-logo.png"
                  alt="Žiju life"
                  width={120}
                  height={48}
                  className="h-10 md:h-12 w-auto mx-auto md:mx-0"
                />
              </div>
              <p className="text-sm text-foreground/60">
                A učím se to za pochodu.
              </p>
            </div>
            
            {/* Certifikáty mezi nadpisem a odkazy */}
            <div className="w-full md:w-auto">
              <Certificates />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Link href="/blog" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                Blog
              </Link>
              <Link href="/komunita" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                Komunita
              </Link>
              <Link href="/o-mne" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                O mně
              </Link>
              <Link href="/kontakt" className="text-sm text-foreground/70 hover:text-accent transition-colors">
                Kontakt
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-black/5 text-center space-y-4">
            {/* Sociální sítě */}
            <div className="flex justify-center items-center gap-4">
              <a
                href="https://www.instagram.com/ziju.life/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-foreground/60 hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.skool.com/zijem-life-3913"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/60 hover:text-accent transition-colors font-semibold"
                aria-label="Skool komunita"
              >
                Skool
              </a>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              <Link href="/gdpr" className="text-foreground/60 hover:text-accent transition-colors">
                Cookies & GDPR
              </Link>
              <span className="text-foreground/30">•</span>
              <Link href="/unsubscribe" className="text-foreground/60 hover:text-accent transition-colors">
                Odhlásit se z newsletteru
              </Link>
            </div>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Žiju life. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
