import Link from 'next/link';
import { Apple, Smartphone, ArrowRight } from 'lucide-react';
import { AnimateOnScroll } from '@web/components/ui/AnimateOnScroll';

export function AppStoreCTA() {
  return (
    <section id="download" className="py-2xl md:py-[96px]">
      <div className="container-lg">
        <AnimateOnScroll preset="scaleIn" duration={0.7} className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary-light via-card to-card p-xl shadow-cardLg md:p-2xl">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-[120px] -top-[120px] h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-[120px] -left-[120px] h-[280px] w-[280px] rounded-full bg-teal/10 blur-3xl" />

          <div className="relative mx-auto max-w-[720px] text-center">
            <span className="inline-flex items-center gap-sm rounded-full border border-primary/30 bg-card px-md py-xs text-xs font-bold uppercase tracking-wider text-primary">
              <Smartphone className="h-3.5 w-3.5" />
              Nejlepší zážitek v mobilu
            </span>

            <h2 className="mt-md text-2xl font-extrabold tracking-tight text-ink-primary md:text-3xl">
              Stáhni si Calibrate do telefonu
            </h2>
            <p className="mx-auto mt-md max-w-[520px] text-md text-ink-secondary md:text-lg">
              Denní připomínka, offline režim, streak. Aby ti nikdy neuteklo
              nic z toho, co potřebuješ doopravdy znát.
            </p>

            <div className="mt-lg flex flex-col items-center justify-center gap-md md:flex-row">
              <StoreButton
                disabled
                icon={<Apple className="h-5 w-5" />}
                label="Stáhnout na"
                store="App Store"
              />
              <StoreButton
                disabled
                icon={<GooglePlayIcon />}
                label="Stáhnout na"
                store="Google Play"
              />
            </div>
            <p className="mt-md text-xs font-semibold text-ink-muted">
              Připravujeme · Zatím se přihlas na webu a zkus si to
            </p>

            <div className="mt-lg flex justify-center">
              <Link
                href="/login"
                className="group inline-flex items-center gap-sm text-sm font-bold text-primary transition-colors hover:text-primary-dark"
              >
                Nebo začni rovnou tady
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

function StoreButton({
  icon,
  label,
  store,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  store: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center gap-sm rounded-xl border-2 border-ink-primary bg-ink-primary px-lg py-md text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>{icon}</span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-xs font-semibold opacity-80">{label}</span>
        <span className="text-md font-extrabold">{store}</span>
      </span>
    </button>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.137 12l2.561-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303L5.864 2.658z" />
    </svg>
  );
}
