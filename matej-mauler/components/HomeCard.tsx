import { ContactPanel } from "./ContactPanel";
import { ProjectsBar } from "./ProjectsBar";
import { PERSON_DOMAIN, PERSON_NAME } from "@/lib/about";
import type { Dictionary } from "@/lib/dictionaries";

/**
 * Homepage = osobní rozcestník. Hlavička (jméno, popis, motto, kontakty) → lišta projektů
 * → tenká patička. Záměrně krátké: mezi hlavičkou a lištou nic dalšího nepatří.
 */
export function HomeCard({ dict }: { dict: Dictionary }) {
  const a = dict.about;

  return (
    <main className="mm-page">
      <div className="mm-shell">
        <header className="mm-header animate-fade-up">
          <div className="mm-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={64} height={64} className="mm-logo" />
            <div>
              <h1 className="mm-name">{PERSON_NAME}</h1>
              <p className="mm-domain">{PERSON_DOMAIN}</p>
            </div>
          </div>

          <p className="mm-description">{a.description}</p>

          {/* Vlastní třída = hák pro pozdější typografické řešení motta. */}
          <p className="mm-motto">{a.motto}</p>

          <ContactPanel className="mm-contacts--header" label={a.contactLabel} />
        </header>

        <ProjectsBar className="animate-fade-up" />

        <footer className="mm-footer">© {new Date().getFullYear()} {PERSON_NAME}</footer>
      </div>
    </main>
  );
}
