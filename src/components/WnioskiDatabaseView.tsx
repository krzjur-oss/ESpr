import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, Plus, Search, Trash2 } from 'lucide-react';
import {
  CUSTOM_WNIOSKI_CATEGORY_ID,
  WNIOSKI_CATEGORY_OPTIONS,
  buildMergedWnioskiCategories,
} from '../data/wnioskiDatabase';
import { CustomWniosekEntry } from '../types/reports';

interface WnioskiDatabaseViewProps {
  customWnioski: CustomWniosekEntry[];
  canInsertIntoActive: boolean;
  activeDocumentTitle?: string;
  onInsertToActive: (text: string) => void;
  onAddCustomWniosek: (categoryId: string, text: string) => void;
  onDeleteCustomWniosek: (id: string) => void;
}

export const WnioskiDatabaseView: React.FC<WnioskiDatabaseViewProps> = ({
  customWnioski,
  canInsertIntoActive,
  activeDocumentTitle,
  onInsertToActive,
  onAddCustomWniosek,
  onDeleteCustomWniosek,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [insertedKey, setInsertedKey] = useState<string | null>(null);

  const [newCategoryId, setNewCategoryId] = useState<string>(CUSTOM_WNIOSKI_CATEGORY_ID);
  const [newText, setNewText] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const mergedCategories = useMemo(
    () => buildMergedWnioskiCategories(customWnioski),
    [customWnioski]
  );

  const groups = useMemo(
    () => Array.from(new Set(mergedCategories.map((c) => c.group))),
    [mergedCategories]
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mergedCategories
      .filter((cat) => {
        if (selectedGroup !== 'all' && cat.group !== selectedGroup) return false;
        if (!q) return true;
        return (
          cat.label.toLowerCase().includes(q) ||
          cat.items.some((item) => item.text.toLowerCase().includes(q))
        );
      })
      .map((cat) => {
        if (!q) return cat;
        return {
          ...cat,
          items: cat.items.filter(
            (i) => i.text.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
          ),
        };
      });
  }, [mergedCategories, search, selectedGroup]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Clipboard API may be restricted in some environments
    }
  };

  const handleInsert = (text: string, key: string) => {
    onInsertToActive(`• ${text}`);
    setInsertedKey(key);
    setTimeout(() => setInsertedKey(null), 1800);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newText.trim();
    if (!cleaned) return;
    onAddCustomWniosek(newCategoryId, cleaned);
    setNewText('');
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-8">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Baza gotowych sformułowań — Wnioski do dalszej pracy
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Przeglądaj propozycje dla wszystkich etapów, przedmiotów oraz specjalistów, lub dodaj własne wnioski zapisywane lokalnie w Twojej bazie.
        </p>
      </div>

      {/* Add Custom Wniosek Form */}
      <form
        onSubmit={handleCreateSubmit}
        className="mb-6 rounded-xl border border-slate-200 bg-white p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Dodaj własny wniosek do bazy
          </h2>
          {customWnioski.length > 0 && (
            <span className="text-xs text-slate-500 tabular-nums">
              Własne wpisy w bazie: <strong className="text-slate-800">{customWnioski.length}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label htmlFor="new-wniosek-cat" className="sr-only">
              Kategoria wniosku
            </label>
            <select
              id="new-wniosek-cat"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            >
              {WNIOSKI_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Wpisz treść własnego wniosku do dalszej pracy..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Dodano do bazy</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Dodaj do bazy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po przedmiocie lub słowie (np. AI, rozprawka, logopeda)..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
        >
          <option value="all">Wszystkie grupy ({mergedCategories.length} kategorii)</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Nie znaleziono wniosków dla podanych kryteriów wyszukiwania.
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
                <h2 className="text-base font-semibold text-slate-900">{cat.label}</h2>
                <span className="text-xs text-slate-500">{cat.group}</span>
              </div>

              <ul className="divide-y divide-slate-100">
                {cat.items.map((item, idx) => {
                  const key = item.id ?? `${cat.id}_${idx}`;
                  const isCopied = copiedKey === key;
                  const isInserted = insertedKey === key;
                  return (
                    <li
                      key={key}
                      className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm text-slate-800 leading-relaxed">{item.text}</p>
                        {item.isCustom && (
                          <p className="text-xs text-blue-900 font-medium">
                            Własny wpis
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isCustom && item.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomWniosek(item.id!)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700 cursor-pointer whitespace-nowrap"
                            title="Usuń własny wniosek z bazy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Usuń</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.text, key)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Skopiowano</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopiuj</span>
                            </>
                          )}
                        </button>
                        {canInsertIntoActive && (
                          <button
                            type="button"
                            onClick={() => handleInsert(item.text, key)}
                            title={`Wstaw do: ${activeDocumentTitle || 'aktywnego dokumentu'}`}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                          >
                            {isInserted ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Wstawiono</span>
                              </>
                            ) : (
                              <>
                                <span>Wstaw do karty</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
