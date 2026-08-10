import { CONTACTS } from "@/lib/about";

/**
 * Kompaktní blok kontaktů u hlavičky — ne samostatná sekce.
 * Umístění řídí rodič (HomeCard) přes `className`, ne tenhle soubor: dá se tak přesunout
 * vedle textu, do rohu i na konec stránky bez zásahu do markupu uvnitř.
 */
export function ContactPanel({ className, label }: { className?: string; label: string }) {
  return (
    <div className={`mm-contacts${className ? ` ${className}` : ""}`}>
      <span className="mm-contacts-label">{label}</span>
      <ul className="mm-contacts-list">
        {CONTACTS.map((c) => (
          <li key={c.id}>
            <a
              href={c.href}
              className="mm-contact"
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
