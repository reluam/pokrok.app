"use client";

import { useState } from "react";
import styles from "./error.module.css";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  const [tried, setTried] = useState(false);

  function handleReset() {
    setTried(true);
    reset();
  }

  const subject = encodeURIComponent("Problém v aplikaci Povídej");
  const body = encodeURIComponent(
    `Ahoj,\n\nnarazil/a jsem na problém v aplikaci Povídej.\n\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\nKód chyby: ${error.digest ?? "–"}\n\nPopis situace:\n`
  );

  return (
    <div className={styles.container}>
      <div className={styles.emoji}>😕</div>
      <h2 className={styles.title}>Něco se pokazilo</h2>
      <p className={styles.message}>
        Zkus prosím obnovit stránku — většinou to pomůže.
      </p>
      <button onClick={handleReset} className={styles.button}>
        Obnovit stránku
      </button>
      {tried && (
        <a
          href={`mailto:matej@ziju.life?subject=${subject}&body=${body}`}
          className={styles.reportLink}
        >
          Nahlásit problém →
        </a>
      )}
    </div>
  );
}
