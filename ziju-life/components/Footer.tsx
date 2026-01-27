import Link from "next/link";
import Image from "next/image";
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
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Žiju life. Všechna práva vyhrazena.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
