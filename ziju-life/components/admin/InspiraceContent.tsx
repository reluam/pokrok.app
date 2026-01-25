"use client";

import { useEffect, useState } from "react";
import { Plus, X, Book, Video, FileText, PenTool, HelpCircle, Edit2, Trash2, LayoutGrid, Table2, Search } from "lucide-react";
import type { InspirationData, InspirationItem, InspirationType } from "@/lib/inspiration";

type ViewMode = "cards" | "table";

const getTypeLabel = (type: InspirationType): string => {
  switch (type) {
    case "blog": return "Blog";
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
    default: return type;
  }
};

const getTypeIcon = (type: InspirationType) => {
  switch (type) {
    case "blog": return PenTool;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    default: return FileText;
  }
};

export default function InspiraceContent() {
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<InspirationType | "all">("all");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<InspirationType | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: InspirationItem; type: InspirationType } | null>(null);
  const [formData, setFormData] = useState<Partial<InspirationItem>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/inspiration?includeInactive=true");
      const data = await res.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const toggleActive = async (item: InspirationItem, type: InspirationType) => {
    try {
      const res = await fetch("/api/inspiration/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id: item.id,
          isActive: !(item.isActive ?? true),
        }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Chyba při změně stavu");
      }
    } catch (error) {
      console.error("Error toggling active:", error);
      alert("Chyba při změně stavu");
    }
  };

  const openTypeSelector = () => {
    setShowTypeSelector(true);
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const selectType = (type: InspirationType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    setShowForm(true);
    setFormData({ type, isActive: true });
  };

  const openEditModal = (item: InspirationItem, type: InspirationType) => {
    setEditingItem({ item, type });
    setSelectedType(type);
    setFormData({ ...item });
    setShowForm(true);
    setShowTypeSelector(false);
  };

  const closeModal = () => {
    setShowTypeSelector(false);
    setShowForm(false);
    setSelectedType(null);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!selectedType) return;

    const requiredFields = ["title", "description"];
    if (selectedType !== "blog" && !formData.url) {
      alert("Vyplňte prosím URL");
      return;
    }
    if (selectedType === "blog" && !formData.content) {
      alert("Vyplňte prosím obsah blogu");
      return;
    }

    for (const field of requiredFields) {
      if (!formData[field as keyof InspirationItem]) {
        alert(`Vyplňte prosím pole: ${field}`);
        return;
      }
    }

    try {
      const url = "/api/inspiration";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem
        ? { type: selectedType, id: editingItem.item.id, ...formData }
        : { type: selectedType, ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchData();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || "Chyba při ukládání");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Chyba při ukládání");
    }
  };

  const handleDelete = async (item: InspirationItem, type: InspirationType) => {
    if (!confirm(`Opravdu chcete smazat "${item.title}"?`)) return;

    try {
      const res = await fetch(`/api/inspiration?type=${type}&id=${item.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Chyba při mazání");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Chyba při mazání");
    }
  };

  const getAllItems = (): Array<InspirationItem & { category: InspirationType }> => {
    if (!data) return [];
    return [
      ...data.blogs.map((item) => ({ ...item, category: "blog" as InspirationType })),
      ...data.videos.map((item) => ({ ...item, category: "video" as InspirationType })),
      ...data.books.map((item) => ({ ...item, category: "book" as InspirationType })),
      ...data.articles.map((item) => ({ ...item, category: "article" as InspirationType })),
      ...data.other.map((item) => ({ ...item, category: "other" as InspirationType })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getFilteredItems = () => {
    let items = getAllItems();

    if (filterType !== "all") {
      items = items.filter((item) => item.category === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.author && item.author.toLowerCase().includes(query))
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground/60">Načítání...</p>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Správa inspirací</h1>
          <p className="text-foreground/70">Přehled a správa všech inspirací</p>
        </div>
        <button
          onClick={openTypeSelector}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={20} />
          Přidat inspiraci
        </button>
      </div>

      {/* View Mode Toggle and Filters */}
      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "cards"
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-foreground/70 hover:bg-gray-200"
              }`}
              title="Zobrazení karet"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-foreground/70 hover:bg-gray-200"
              }`}
              title="Tabulkové zobrazení"
            >
              <Table2 size={20} />
            </button>
          </div>

          {/* Search and Type Filter */}
          <div className="flex flex-wrap gap-3 flex-1 md:justify-end">
            {/* Search */}
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                placeholder="Hledat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InspirationType | "all")}
              className="px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white font-semibold"
            >
              <option value="all">Všechny typy</option>
              <option value="blog">Blog</option>
              <option value="video">Video</option>
              <option value="book">Kniha</option>
              <option value="article">Článek</option>
              <option value="other">Ostatní</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-foreground/60">
              {searchQuery || filterType !== "all"
                ? "Žádné inspirace neodpovídají filtru."
                : "Zatím žádné inspirace. Klikněte na \"Přidat inspiraci\" pro vytvoření první."}
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredItems.map((item) => {
                const Icon = getTypeIcon(item.category);
                const isActive = item.isActive ?? true;
                return (
                  <div
                    key={item.id}
                    className={`p-6 hover:bg-black/5 transition-colors ${
                      !isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="text-accent" size={20} />
                          <span className="text-sm font-semibold text-accent">
                            {getTypeLabel(item.category)}
                          </span>
                          {!isActive && (
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                              Neaktivní
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{item.title}</h3>
                        {item.author && (
                          <p className="text-sm text-foreground/60 mb-2">Autor: {item.author}</p>
                        )}
                        <p className="text-foreground/70 mb-2">{item.description}</p>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent hover:underline"
                          >
                            {item.url}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {/* Active/Inactive Toggle */}
                        <button
                          onClick={() => toggleActive(item, item.category)}
                          className={`p-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={isActive ? "Deaktivovat" : "Aktivovat"}
                        >
                          {isActive ? "✓" : "○"}
                        </button>
                        <button
                          onClick={() => openEditModal(item, item.category)}
                          className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          title="Upravit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item, item.category)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Smazat"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-foreground/60">
              {searchQuery || filterType !== "all"
                ? "Žádné inspirace neodpovídají filtru."
                : "Zatím žádné inspirace. Klikněte na \"Přidat inspiraci\" pro vytvoření první."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Typ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Název</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Autor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Popis</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Aktivní</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredItems.map((item) => {
                    const Icon = getTypeIcon(item.category);
                    const isActive = item.isActive ?? true;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-black/5 transition-colors ${!isActive ? "opacity-60" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Icon className="text-accent" size={18} />
                            <span className="text-sm text-foreground">{getTypeLabel(item.category)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/70">
                          {item.author || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/70 max-w-md">
                          <div className="truncate" title={item.description}>
                            {item.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(item, item.category)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {isActive ? "Aktivní" : "Neaktivní"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(item, item.category)}
                              className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                              title="Upravit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item, item.category)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Smazat"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Type Selector Modal */}
      {showTypeSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Zavřít"
            >
              <X size={24} className="text-foreground/70" />
            </button>

            <h2 className="text-2xl font-bold text-foreground mb-6">Vyberte typ inspirace</h2>

            <div className="space-y-3">
              {([
                { type: "blog" as InspirationType, icon: PenTool, label: "Blog" },
                { type: "video" as InspirationType, icon: Video, label: "Video" },
                { type: "book" as InspirationType, icon: Book, label: "Kniha" },
                { type: "article" as InspirationType, icon: FileText, label: "Článek" },
                { type: "other" as InspirationType, icon: HelpCircle, label: "Ostatní" },
              ]).map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => selectType(type)}
                  className="w-full flex items-center gap-4 p-4 border-2 border-black/10 rounded-xl hover:border-accent transition-colors text-left"
                >
                  <Icon className="text-accent" size={24} />
                  <span className="text-lg font-semibold text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && selectedType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-foreground/70" />
            </button>

            <h2 className="text-3xl font-bold text-foreground mb-6">
              {editingItem ? "Upravit inspiraci" : `Přidat ${getTypeLabel(selectedType).toLowerCase()}`}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Název *
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                  placeholder="Název"
                  required
                />
              </div>

              {/* Author */}
              {(selectedType === "book" || selectedType === "video" || selectedType === "article") && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={formData.author || ""}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                    placeholder="Autor"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Popis *
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                  rows={4}
                  placeholder="Popis"
                  required
                />
              </div>

              {/* URL */}
              {selectedType !== "blog" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url || ""}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              {/* Video Thumbnail */}
              {selectedType === "video" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Thumbnail URL (obrázek z videa)
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail || ""}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
                    placeholder="https://..."
                  />
                  {formData.thumbnail && (
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="mt-2 rounded-lg max-w-xs"
                    />
                  )}
                </div>
              )}

              {/* Blog Content */}
              {selectedType === "blog" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Obsah blogu *
                  </label>
                  <textarea
                    value={formData.content || ""}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white font-mono text-sm"
                    rows={20}
                    placeholder="Markdown nebo HTML obsah..."
                    required
                  />
                </div>
              )}

              {/* Active/Inactive Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-black/20 text-accent focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Zobrazit na webu (aktivní)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                >
                  {editingItem ? "Uložit změny" : "Přidat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
