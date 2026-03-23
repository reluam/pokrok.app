"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { TOOLS } from "@repo/types";
import { createClient } from "../lib/supabase/client";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/">
            <Image src="/pokrok-logo.png" alt="Pokrok" width={90} height={20} priority />
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link
            href="/"
            className={`${styles.navItem} ${pathname === "/" ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>💬</span>
            <span>Chat</span>
          </Link>

          <p className={styles.sectionLabel}>Nástroje</p>

          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className={`${styles.navItem} ${pathname === `/tools/${tool.id}` ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>{tool.icon}</span>
              <span>{tool.title}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.bottomArea}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>↩</span>
            <span>Odhlásit se</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
