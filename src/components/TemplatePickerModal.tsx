import React, { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, Check, Plus, Search, Trash2, X } from 'lucide-react';
import {
  CustomTemplateEntry,
  TEMPLATE_CATEGORY_LABELS,
  TemplateSectionCategory,
} from '../types/reports';

interface TemplatePickerModalProps {
  isOpen: boolean;
  fieldLabel: string;
  suggestedCategory: TemplateSectionCategory;
  customTemplates: CustomTemplateEntry[];
  onClose: () => void;
  onInsert: (text: string, mode: 'append' | 'replace') => void;
  onAddTemplate: (title: string, category: TemplateSectionCategory, content: string) => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  fieldLabel,
  suggestedCategory,
  customTemplates,
  onClose,
  onInsert,
  onAddTemplate,
  onDeleteTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateSectionCategory>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TemplateSectionCategory>(suggestedCategory);
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const hasSuggested = customTemplates.some((t) => t.category === suggestedCategory);
    setSelectedCategory(hasSuggested ? suggestedCategory : 'all');
    setNewCategory(suggestedCategory);
    setSelectedIds([]);
    setSearch('');
    setShowAddForm(false);
    setNewTitle('');
    setNewContent('');
  }, [isOpen, suggestedCategory, customTemplates.length]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customTemplates.filter((tpl) => {
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.content.toLowerCase().includes(q) ||
        TEMPLATE_CATEGORY_LABELS[tpl.category].toLowerCase().includes(q)
      );
    });
  }, [customTemplates, search, selectedCategory]);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplySelected = (mode: 'append' | 'replace') => {
    const selectedTemplates = customTemplates.filter((t) => selectedIds.includes(t.id));
    if (selectedTemplates.length === 0) return;
    const joined = selectedTemplates.map((t) => t.content.trim()).join('\n');
    onInsert(joined, mode);
    onClose();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedContent = newContent.trim();
    if (!cleanedContent) return;
    const title = newTitle.trim() || cleanedContent.slice(0, 48);
    onAddTemplate(title, newCategory, cleanedContent);
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
    setSelectedCategory(newCategory);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-picker-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0 pr-4">
            <h2 id="template-picker-title" className="text-base font-semibold text-slate-900 truncate">
              Szablony własne — wstaw do pola: {fieldLabel}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Wybierz zapisane fragmenty sprawozdań lub utwórz nowy szablon wielokrotnego użytku
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nowy szablon</span>
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

        {/* Inline Create Template Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="border-b border-slate-200 bg-blue-50/40 px-6 py-4 space-y-2.5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nazwa szablonu (np. Zajęcia profilaktyczne – hejt w sieci)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TemplateSectionCategory)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {TEMPLATE_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Wpisz treść fragmentu do zapisania jako szablon własny..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="self-end rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                Zapisz szablon
              </button>
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
              placeholder="Szukaj po nazwie lub treści szablonu..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as 'all' | TemplateSectionCategory)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
          >
            <option value="all">Wszystkie kategorie ({customTemplates.length})</option>
            {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map((k) => {
              const count = customTemplates.filter((t) => t.category === k).length;
              return (
                <option key={k} value={k}>
                  {TEMPLATE_CATEGORY_LABELS[k]} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {customTemplates.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BookmarkPlus className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-800">
                Brak zapisanych szablonów własnych
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Wypełnij dowolne pole w sprawozdaniu (lub zaznacz jego fragment) i kliknij przycisk{' '}
                <strong>„Zapisz jako szablon”</strong>, albo utwórz pierwszy szablon przyciskiem{' '}
                <strong>„Nowy szablon”</strong> powyżej.
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-slate-500">
                Brak szablonów w wybranej kategorii lub dla wpisanej frazy.
              </p>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
                >
                  Pokaż wszystkie szablony ({customTemplates.length})
                </button>
              )}
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const checked = selectedIds.includes(tpl.id);
              return (
                <div
                  key={tpl.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                    checked
                      ? 'border-blue-900 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleId(tpl.id)}
                    className="flex flex-1 items-start gap-3 text-left cursor-pointer min-w-0"
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
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {tpl.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          · {TEMPLATE_CATEGORY_LABELS[tpl.category]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {tpl.content}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(tpl.id)}
                      className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                      title="Usuń szablon"
                      aria-label={`Usuń szablon ${tpl.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(tpl.content.trim(), 'append');
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-900 hover:bg-blue-50 whitespace-nowrap cursor-pointer"
                      title="Dopisz od razu ten szablon do pola"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Wstaw</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-600 tabular-nums">
            Zaznaczono: <strong className="text-slate-900">{selectedIds.length}</strong>
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplySelected('replace')}
              className="rounded-lg border border-blue-900 bg-white px-3.5 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Zastąp treść pola
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplySelected('append')}
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
