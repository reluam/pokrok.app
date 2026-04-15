'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useWebUserStore } from '@web/lib/user-store';

export function TopNav() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0.6, 0.9]);
  const isAuthenticated = useWebUserStore((s) => s.isAuthenticated);
  const displayName = useWebUserStore((s) => s.displayName);
  const logout = useWebUserStore((s) => s.logout);

  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: useTransform(
          bgOpacity,
          (v) => `rgba(253, 253, 247, ${v})`
        ),
      }}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-border-subtle"
        style={{ opacity: borderOpacity }}
      />
      <div className="container-lg flex h-[64px] items-center justify-between">
        <Link href="/" className="flex items-center gap-sm group">
          <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover:rotate-[-6deg]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-ink-primary">
            Calibrate
          </span>
        </Link>

        <nav className="flex items-center gap-md">
          <a
            href="#how-it-works"
            className="hidden text-sm font-semibold text-ink-secondary transition-colors hover:text-primary md:block"
          >
            Jak to funguje
          </a>
          <a
            href="#concepts"
            className="hidden text-sm font-semibold text-ink-secondary transition-colors hover:text-primary md:block"
          >
            Koncepty
          </a>
          <a
            href="#download"
            className="hidden text-sm font-semibold text-ink-secondary transition-colors hover:text-primary md:block"
          >
            Stáhnout
          </a>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-md py-xs text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-card"
            >
              Můj účet
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border-2 border-border-light bg-card px-md py-xs text-sm font-bold text-ink-primary transition-colors hover:border-primary"
              >
                Přihlásit se
              </Link>
              <Link
                href="/login"
                className="hidden rounded-full bg-primary px-md py-xs text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-card md:inline-block"
              >
                Začít zdarma
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
