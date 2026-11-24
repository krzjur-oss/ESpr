import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import {
  CUSTOM_WNIOSKI_CATEGORY_ID,
  WNIOSKI_CATEGORY_OPTIONS,
  buildMergedWnioskiCategories,
} from '../data/wnioskiDatabase';
import { CustomWniosekEntry } from '../types/reports';

interface ConclusionPickerModalProps {
  isOpen: boolean;
  suggestedCategoryId?: string | null;
  customWnioski: CustomWniosekEntry[];
  onClose: () => void;
  onInsert: (text: string, mode: 'append' | 'replace') => void;
  onAddCustomWniosek: (categoryId: string, text: string) => void;
  onDeleteCustomWniosek: (id: string) => void;
}

export const ConclusionPickerModal: React.FC<ConclusionPickerModalProps> = ({
  isOpen,
  suggestedCategoryId,
  customWnioski,
  onClose,
  onInsert,
  onAddCustomWniosek,
  onDeleteCustomWniosek,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<string>(CUSTOM_WNIOSKI_CATEGORY_ID);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId(suggestedCategoryId || 'all');
      setNewCategoryId(suggestedCategoryId || CUSTOM_WNIOSKI_CATEGORY_ID);
      setSelectedItems([]);
      setSearch('');
      setShowAddForm(false);
      setNewText('');
    }
  }, [isOpen, suggestedCategoryId]);

  const mergedCategories = useMemo(
    () => buildMergedWnioskiCategories(customWnioski),
    [customWnioski]
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mergedCategories
      .filter((cat) => {
        if (selectedCategoryId !== 'all' && cat.id !== selectedCategoryId) {
          return false;
        }
        if (!q) return true;
        return (
          cat.label.toLowerCase().includes(q) ||
          cat.items.some((item) => item.text.toLowerCase().includes(q))
        );
      })
      .map((cat) => {
        if (!q) return cat;
        const matchingItems = cat.items.filter(
          (item) => item.text.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
        );
        return { ...cat, items: matchingItems };
      });
  }, [mergedCategories, search, selectedCategoryId]);

  if (!isOpen) return null;

  const toggleItem = (text: string) => {
    setSelectedItems((prev) =>
      prev.includes(text) ? prev.filter((i) => i !== text) : [...prev, text]
    );
  };

  const handleApply = (mode: 'append' | 'replace') => {
    if (selectedItems.length === 0) return;
    const formatted = selectedItems.map((item) => `• ${item}`).join('\n');
    onInsert(formatted, mode);
    onClose();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newText.trim();
    if (!cleaned) return;
    onAddCustomWniosek(newCategoryId, cleaned);
    setSelectedItems((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
    if (selectedCategoryId !== 'all' && selectedCategoryId !== newCategoryId) {
      setSelectedCategoryId(newCategoryId);
    }
    setNewText('');
    setShowAddForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conclusion-picker-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="conclusion-picker-title" className="text-base font-semibold text-slate-900">
              Baza podpowiedzi — Wnioski do dalszej pracy
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Wybierz gotowe sformułowania lub dodaj własny wniosek na stałe do swojej bazy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj własny</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Add Custom Conclusion Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="border-b border-slate-200 bg-blue-50/40 px-6 py-3.5 space-y-2.5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                {WNIOSKI_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2 flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Wpisz własny wniosek (zostanie zapisany w bazie i zaznaczony)..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newText.trim()}
                  className="rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap cursor-pointer"
                >
                  Zapisz w bazie
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj wniosku lub słowa kluczowego (np. czytanie, AI, ułamki)..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
            />
          </div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
          >
            <option value="all">Wszystkie przedmioty, etapy i stanowiska</option>
            {mergedCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Brak wniosków pasujących do wpisanej frazy. Spróbuj innego słowa kluczowego lub zmień kategorię.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <section key={cat.id}>
                <div className="flex items-baseline justify-between border-b border-slate-200 pb-1.5 mb-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                  <span className="text-xs text-slate-500">{cat.group}</span>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, idx) => {
                    const checked = selectedItems.includes(item.text);
                    const itemKey = item.id ?? `${cat.id}_${idx}`;
                    return (
                      <div
                        key={itemKey}
                        className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
                          checked
                            ? 'border-blue-900 bg-blue-50/50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(item.text)}
                          className="flex flex-1 items-start gap-3 text-left cursor-pointer"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              checked
                                ? 'border-blue-900 bg-blue-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                          <span className="text-sm text-slate-800 leading-relaxed">
                            {item.text}
                            {item.isCustom && (
                              <span className="ml-2 text-xs font-medium text-blue-900">
                                · Własny
                              </span>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.isCustom && item.id && (
                            <button
                              type="button"
                              onClick={() => onDeleteCustomWniosek(item.id!)}
                              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              title="Usuń własny wniosek z bazy"
                              aria-label="Usuń własny wniosek"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onInsert(`• ${item.text}`, 'append');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-900 hover:bg-blue-50 whitespace-nowrap cursor-pointer"
                            title="Wstaw od razu ten punkt"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Wstaw</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-600 tabular-nums">
            Zaznaczono: <strong className="text-slate-900">{selectedItems.length}</strong>
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={() => handleApply('replace')}
              className="rounded-lg border border-blue-900 bg-white px-3.5 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Zastąp treść pola
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={() => handleApply('append')}
              className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Dopisz zaznaczone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
