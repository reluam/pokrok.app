"use client";

import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Mail, Calendar, MessageSquare } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leads-db";

const STATUS_LABELS: Record<LeadStatus, string> = {
  novy: "Nový",
  kontaktovan: "Kontaktován",
  rezervovano: "Rezervováno",
  odmitnuto: "Odmítnuto",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  novy: "bg-blue-100 text-blue-800",
  kontaktovan: "bg-yellow-100 text-yellow-800",
  rezervovano: "bg-green-100 text-green-800",
  odmitnuto: "bg-red-100 text-red-800",
};

export default function CrmContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadLeads();
      }
    } catch {
      // Error handling
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      search === "" ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.name && lead.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
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
        <h2 className="text-3xl font-bold text-foreground mb-2">CRM / Klienti</h2>
        <p className="text-foreground/70">
          Správa leadů a klientů. Leady lze převést na klienty a přidat poznámky.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border-2 border-black/10 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat podle jména nebo e-mailu..."
              className="w-full pl-10 pr-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-foreground/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          >
            <option value="all">Všechny stavy</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="text-center py-12 text-foreground/60">Načítání...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          {leads.length === 0 ? "Zatím žádné leady." : "Žádné leady neodpovídají filtru."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
          <div className="divide-y divide-black/10">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 hover:bg-black/5 transition-colors cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {lead.name || "Bez jména"}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}
                      >
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(lead.createdAt)}
                      </span>
                      {lead.source && (
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                          {lead.source === "funnel"
                            ? "Funnel"
                            : lead.source === "homepage"
                              ? "Homepage"
                              : lead.source === "koucing"
                                ? "Koučink"
                                : lead.source}
                        </span>
                      )}
                    </div>
                    {lead.message && (
                      <p className="mt-2 text-sm text-foreground/60 line-clamp-2 flex items-start gap-1">
                        <MessageSquare size={14} className="mt-0.5 shrink-0" />
                        {lead.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateLeadStatus(lead.id, e.target.value as LeadStatus)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-sm border-2 border-black/10 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {selectedLead.name || "Bez jména"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
                <p className="text-foreground/80">{selectedLead.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Stav</label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value as LeadStatus)}
                  className="px-3 py-2 border-2 border-black/10 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {selectedLead.message && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Zpráva</label>
                  <p className="text-foreground/80 whitespace-pre-wrap">{selectedLead.message}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Poznámky</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Přidej poznámky k tomuto leadu..."
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 border-2 border-black/10 rounded-xl font-semibold hover:bg-black/5 transition-colors"
                >
                  Zavřít
                </button>
                <button
                  onClick={() => {
                    // TODO: Save notes
                    setSelectedLead(null);
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors"
                >
                  Uložit poznámky
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
