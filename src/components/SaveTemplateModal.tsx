import React, { useEffect, useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import {
  TEMPLATE_CATEGORY_LABELS,
  TemplateSectionCategory,
} from '../types/reports';

interface SaveTemplateModalProps {
  isOpen: boolean;
  fieldLabel: string;
  initialContent: string;
  suggestedCategory: TemplateSectionCategory;
  fromSelection: boolean;
  onClose: () => void;
  onSave: (title: string, category: TemplateSectionCategory, content: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  fieldLabel,
  initialContent,
  suggestedCategory,
  fromSelection,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TemplateSectionCategory>(suggestedCategory);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (!isOpen) return;
    const firstLine = initialContent.trim().split('\n')[0]?.replace(/^[•\-*]\s*/, '') ?? '';
    const autoTitle =
      firstLine.length > 50 ? `${firstLine.slice(0, 47).trim()}…` : firstLine;
    setTitle(autoTitle || fieldLabel);
    setCategory(suggestedCategory);
    setContent(initialContent);
  }, [isOpen, initialContent, suggestedCategory, fieldLabel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedContent = content.trim();
    if (!cleanedContent) return;
    const finalTitle = title.trim() || fieldLabel;
    onSave(finalTitle, category, cleanedContent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookmarkPlus className="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <h2 id="save-template-title" className="text-base font-semibold text-slate-900">
                Zapisz jako szablon własny
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {fromSelection
                  ? 'Zapisujesz zaznaczony fragment tekstu z pola formularza'
                  : `Fragment z pola: ${fieldLabel}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="tpl-title-input" className="block text-xs font-medium text-slate-700">
              Nazwa szablonu (ułatwia szybkie wyszukanie)
            </label>
            <input
              id="tpl-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Wycieczka do centrum nauki lub Warsztaty profilaktyczne"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tpl-cat-select" className="block text-xs font-medium text-slate-700">
              Kategoria szablonu
            </label>
            <select
              id="tpl-cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateSectionCategory)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            >
              {(Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateSectionCategory[]).map((k) => (
                <option key={k} value={k}>
                  {TEMPLATE_CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tpl-content-input" className="block text-xs font-medium text-slate-700">
              Treść fragmentu (możesz dostosować przed zapisem)
            </label>
            <textarea
              id="tpl-content-input"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={!content.trim()}
            className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Zapisz szablon
          </button>
        </div>
      </form>
    </div>
  );
};
