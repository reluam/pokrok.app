"use client";

import { useEffect, useState } from "react";
import { Trash2, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import type { NewsletterSubscriber } from "@/lib/newsletter-db";

export default function NewsletterContent() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/newsletter/subscribers");
      if (!res.ok) {
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

  const handleSyncResend = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    setSyncError("");

    try {
      const res = await fetch("/api/admin/newsletter/sync-resend", {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Chyba při synchronizaci");
      }

      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSyncError(err.message || "Chyba při synchronizaci kontaktů");
      setTimeout(() => {
        setSyncError("");
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground/60">Načítání...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Newsletter Subscribers</h1>
          <p className="text-foreground/70">Celkem: {subscribers.length} emailů</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncResend}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Synchronizuji...
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle2 size={18} className="text-green-600" />
                Synchronizováno
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Synchronizovat do Resend
              </>
            )}
          </button>
          <button
            onClick={exportEmails}
            className="flex items-center gap-2 px-6 py-3 border-2 border-black/10 rounded-full font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <Mail size={18} />
            Exportovat emaily
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {syncError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {syncError}
        </div>
      )}

      {syncSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Kontakty byly úspěšně synchronizovány do Resend
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
                      {new Date(subscriber.createdAt).toLocaleDateString("cs-CZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
  );
}
