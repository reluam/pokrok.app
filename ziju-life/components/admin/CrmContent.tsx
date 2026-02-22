"use client";

import { useState, useEffect } from "react";
import { Search, Trash2 } from "lucide-react";

export type ContactRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  reservationDate: string | null;
};

export default function CrmContent() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      if (res.ok) {
        setContacts(data.leads || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Nepodařilo se odstranit.");
      }
    } catch {
      alert("Chyba při mazání.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Přehled kontaktů
        </h2>
        <p className="text-foreground/70">
          Záloha lidí, kteří se zaregistrovali (formulář, rezervace). Jméno, e-mail, datum rezervace a možnost řádek odstranit.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border-2 border-black/10">
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat podle jména nebo e-mailu..."
            className="w-full pl-10 pr-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-foreground/60">Načítání...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          {contacts.length === 0
            ? "Zatím žádné kontakty."
            : "Žádný kontakt neodpovídá hledání."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black/10 bg-black/5">
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Jméno
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    E-mail
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Datum rezervace
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground w-[100px]">
                    Smazat
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-black/10 hover:bg-black/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {c.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-foreground/80">
                      {formatDate(c.reservationDate)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteContact(c.id)}
                        disabled={deletingId === c.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Odstranit"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
