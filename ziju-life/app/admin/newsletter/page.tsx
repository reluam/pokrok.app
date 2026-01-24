"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Mail, LogOut } from "lucide-react";
import type { NewsletterSubscriber } from "@/lib/newsletter-db";

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/newsletter/subscribers");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch subscribers");
      }
      const data = await res.json();
      setSubscribers(data);
      setLoading(false);
    } catch (err) {
      setError("Chyba při načítání emailů");
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chceš smazat tento email?")) return;

    try {
      const res = await fetch(`/api/newsletter/subscribers?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      fetchSubscribers();
    } catch (err) {
      alert("Chyba při mazání");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const exportEmails = () => {
    const emails = subscribers.map((s) => s.email).join("\n");
    const blob = new Blob([emails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-emails-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/50">
        <p className="text-foreground/60">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Newsletter Subscribers
            </h1>
            <p className="text-foreground/70">
              Celkem: {subscribers.length} emailů
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportEmails}
              className="flex items-center gap-2 px-6 py-3 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <Mail size={18} />
              Exportovat emaily
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              <LogOut size={18} />
              Odhlásit se
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {subscribers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-black/5 text-center">
            <p className="text-foreground/60">Zatím žádné emaily</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/50 border-b-2 border-black/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Datum přihlášení
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="border-b border-black/5 hover:bg-white/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground">
                        {subscriber.email}
                      </td>
                      <td className="px-6 py-4 text-foreground/70">
                        {new Date(subscriber.createdAt).toLocaleDateString(
                          "cs-CZ",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(subscriber.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Smazat"
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
    </div>
  );
}
