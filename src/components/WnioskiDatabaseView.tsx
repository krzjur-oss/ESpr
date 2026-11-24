import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Copy,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CUSTOM_WNIOSKI_CATEGORY_ID,
  WNIOSKI_CATEGORY_OPTIONS,
  buildMergedWnioskiCategories,
} from '../data/wnioskiDatabase';
import {
  CustomTemplateEntry,
  CustomWniosekEntry,
  TEMPLATE_CATEGORY_LABELS,
  TemplateSectionCategory,
} from '../types/reports';

interface WnioskiDatabaseViewProps {
  customWnioski: CustomWniosekEntry[];
  customTemplates: CustomTemplateEntry[];
  canInsertIntoActive: boolean;
  activeDocumentTitle?: string;
  onInsertToActive: (text: string) => void;
  onAddCustomWniosek: (categoryId: string, text: string) => void;
  onDeleteCustomWniosek: (id: string) => void;
  onAddCustomTemplate: (
    title: string,
    category: TemplateSectionCategory,
    content: string
  ) => void;
  onUpdateCustomTemplate: (
    id: string,
    patch: Partial<Pick<CustomTemplateEntry, 'title' | 'category' | 'content'>>
  ) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onOpenShareModal: (mode: 'export' | 'import') => void;
}

export const WnioskiDatabaseView: React.FC<WnioskiDatabaseViewProps> = ({
  customWnioski,
  customTemplates,
  canInsertIntoActive,
  activeDocumentTitle,
  onInsertToActive,
  onAddCustomWniosek,
  onDeleteCustomWniosek,
  onAddCustomTemplate,
  onUpdateCustomTemplate,
  onDeleteCustomTemplate,
  onOpenShareModal,
}) => {
  const [subTab, setSubTab] = useState<'wnioski' | 'szablony'>('wnioski');

  // Conclusions state
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [insertedKey, setInsertedKey] = useState<string | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<string>(CUSTOM_WNIOSKI_CATEGORY_ID);
  const [newText, setNewText] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Custom templates state
  const [tplSearch, setTplSearch] = useState('');
  const [tplCategoryFilter, setTplCategoryFilter] = useState<'all' | TemplateSectionCategory>('all');
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<TemplateSectionCategory>('ogolne');
  const [newTplContent, setNewTplContent] = useState('');
  const [tplAddedFeedback, setTplAddedFeedback] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [editTplTitle, setEditTplTitle] = useState('');
  const [editTplCategory, setEditTplCategory] = useState<TemplateSectionCategory>('ogolne');
  const [editTplContent, setEditTplContent] = useState('');

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

  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return customTemplates.filter((tpl) => {
      if (tplCategoryFilter !== 'all' && tpl.category !== tplCategoryFilter) return false;
      if (!q) return true;
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.content.toLowerCase().includes(q) ||
        TEMPLATE_CATEGORY_LABELS[tpl.category].toLowerCase().includes(q)
      );
    });
  }, [customTemplates, tplSearch, tplCategoryFilter]);

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

  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTplContent.trim();
    if (!cleaned) return;
    const title = newTplTitle.trim() || cleaned.slice(0, 48);
    onAddCustomTemplate(title, newTplCategory, cleaned);
    setNewTplTitle('');
    setNewTplContent('');
    setTplAddedFeedback(true);
    setTimeout(() => setTplAddedFeedback(false), 2000);
  };

  const startEditingTemplate = (tpl: CustomTemplateEntry) => {
    setEditingTplId(tpl.id);
    setEditTplTitle(tpl.title);
    setEditTplCategory(tpl.category);
    setEditTplContent(tpl.content);
  };

  const saveTemplateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTplId || !editTplContent.trim()) return;
    onUpdateCustomTemplate(editingTplId, {
      title: editTplTitle.trim() || 'Szablon własny',
      category: editTplCategory,
      content: editTplContent.trim(),
    });
    setEditingTplId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-8">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Baza wniosków i szablony własne
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Korzystaj z gotowego słownika wniosków oraz własnych zapisanych fragmentów treści, które wstawisz jednym kliknięciem do dowolnego sprawozdania.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenShareModal('export')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Zapisz własne wnioski i szablony do pliku JSON, aby udostępnić je współpracownikom lub przenieść na inne urządzenie"
            >
              <Download className="w-3.5 h-3.5 text-blue-900" />
              <span>Eksportuj JSON</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenShareModal('import')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-900 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Wczytaj własne wnioski lub szablony z pliku JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importuj JSON</span>
            </button>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div
          role="tablist"
          aria-label="Widok bazy sformułowań"
          className="mt-5 inline-flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'wnioski'}
            onClick={() => setSubTab('wnioski')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'wnioski'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Baza wniosków ({mergedCategories.length} kat.)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'szablony'}
            onClick={() => setSubTab('szablony')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'szablony'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="tabular-nums">Szablony własne ({customTemplates.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Baza wniosków */}
      {subTab === 'wnioski' && (
        <>
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
                              <p className="text-xs text-blue-900 font-medium">Własny wpis</p>
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
        </>
      )}

      {/* TAB 2: Szablony własne */}
      {subTab === 'szablony' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateTemplateSubmit}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Utwórz nowy szablon własny
              </h2>
              <span className="text-xs text-slate-500">
                Możesz też zapisywać fragmenty bezpośrednio z dowolnego pola w Kreatorze
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTplTitle}
                onChange={(e) => setNewTplTitle(e.target.value)}
                placeholder="Nazwa szablonu (np. Zajęcia profilaktyczne – bezpieczeństwo w sieci)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
              />
              <select
                value={newTplCategory}
                onChange={(e) => setNewTplCategory(e.target.value as TemplateSectionCategory)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {TEMPLATE_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                rows={3}
                value={newTplContent}
                onChange={(e) => setNewTplContent(e.target.value)}
                placeholder="Wpisz treść fragmentu sprawozdania do wielokrotnego użycia..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={!newTplContent.trim()}
                className="self-end inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {tplAddedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Zapisano szablon</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Zapisz szablon</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={tplSearch}
                onChange={(e) => setTplSearch(e.target.value)}
                placeholder="Szukaj szablonu po nazwie lub treści..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
              />
            </div>
            <select
              value={tplCategoryFilter}
              onChange={(e) =>
                setTplCategoryFilter(e.target.value as 'all' | TemplateSectionCategory)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            >
              <option value="all">Wszystkie kategorie ({customTemplates.length})</option>
              {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map((k) => (
                <option key={k} value={k}>
                  {TEMPLATE_CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          {/* Templates list */}
          {customTemplates.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-800">
                Nie masz jeszcze żadnych szablonów własnych
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Dodaj szablon powyżej albo podczas wypełniania sprawozdania kliknij{' '}
                <strong>„Zapisz jako szablon”</strong> przy dowolnym polu tekstowym.
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Brak szablonów spełniających kryteria wyszukiwania.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((tpl) => {
                const isEditing = editingTplId === tpl.id;
                const copyKey = `tpl_${tpl.id}`;
                const isCopied = copiedKey === copyKey;
                return (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    {isEditing ? (
                      <form onSubmit={saveTemplateEdit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editTplTitle}
                            onChange={(e) => setEditTplTitle(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                            required
                          />
                          <select
                            value={editTplCategory}
                            onChange={(e) =>
                              setEditTplCategory(e.target.value as TemplateSectionCategory)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                          >
                            {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map(
                              (k) => (
                                <option key={k} value={k}>
                                  {TEMPLATE_CATEGORY_LABELS[k]}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <textarea
                          rows={4}
                          value={editTplContent}
                          onChange={(e) => setEditTplContent(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-900 focus:outline-none"
                          required
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTplId(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Anuluj</span>
                          </button>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Zapisz zmiany</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{tpl.title}</h3>
                            <span className="text-xs text-slate-500">
                              · {TEMPLATE_CATEGORY_LABELS[tpl.category]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {tpl.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditingTemplate(tpl)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edytuj</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(tpl.content, copyKey)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
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
                          <button
                            type="button"
                            onClick={() => onDeleteCustomTemplate(tpl.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Usuń</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
