import React, { useRef } from 'react';
import { Bookmark, BookmarkPlus, BookOpen, RotateCcw } from 'lucide-react';
import { useTemplates } from '../../context/TemplatesContext';
import { TemplateSectionCategory } from '../../types/reports';

interface SectionHeaderProps {
  index: string;
  title: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ index, title, subtitle }) => (
  <div className="border-b border-slate-200 pb-2 mb-4">
    <h3 className="text-sm font-semibold text-slate-900">
      <span className="font-mono-tabular text-blue-900 mr-2">{index}.</span>
      {title}
    </h3>
    {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
  </div>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, hint, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-700">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20 focus:outline-none transition-colors';

export const textareaClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20 focus:outline-none transition-colors leading-relaxed';

function extractSelectionOrFullText(
  el: HTMLTextAreaElement | null,
  fallbackValue: string
): { text: string; fromSelection: boolean } {
  if (el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (end > start) {
      const selected = el.value.slice(start, end);
      if (selected.trim().length > 0) {
        return { text: selected.trim(), fromSelection: true };
      }
    }
  }
  return { text: fallbackValue.trim(), fromSelection: false };
}

function applyTemplateInsertion(
  currentValue: string,
  insertedText: string,
  mode: 'append' | 'replace'
): string {
  const current = currentValue.trim();
  if (mode === 'replace' || !current) return insertedText;
  return `${current}\n${insertedText}`;
}

interface TemplateTextareaFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  category: TemplateSectionCategory;
  placeholder?: string;
  rows?: number;
}

export const TemplateTextareaField: React.FC<TemplateTextareaFieldProps> = ({
  label,
  value,
  onChange,
  category,
  placeholder,
  rows = 3,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const templates = useTemplates();
  const hasContent = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-medium text-slate-700">{label}</label>
        {templates && (
          <div className="flex items-center gap-1.5">
            {hasContent && (
              <button
                type="button"
                onClick={() => {
                  const { text, fromSelection } = extractSelectionOrFullText(
                    textareaRef.current,
                    value
                  );
                  templates.openSaveTemplate({
                    fieldLabel: label,
                    suggestedCategory: category,
                    initialContent: text,
                    fromSelection,
                  });
                }}
                title="Zapisz cały wpis lub zaznaczony fragment jako szablon własny"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookmarkPlus className="w-3 h-3 text-blue-900" />
                <span>Zapisz jako szablon</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                templates.openTemplatePicker({
                  fieldLabel: label,
                  suggestedCategory: category,
                  onApply: (text, mode) =>
                    onChange(applyTemplateInsertion(value, text, mode)),
                })
              }
              title="Wstaw zapisany wcześniej szablon własny"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bookmark className="w-3 h-3 text-blue-900" />
              <span>
                Szablony własne
                {templates.templatesCount > 0 ? ` (${templates.templatesCount})` : ''}
              </span>
            </button>
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={textareaClass}
      />
    </div>
  );
};

interface ConclusionsFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onOpenPicker: () => void;
  placeholder?: string;
  rows?: number;
}

export const ConclusionsField: React.FC<ConclusionsFieldProps> = ({
  label,
  value,
  onChange,
  onOpenPicker,
  placeholder,
  rows = 5,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const templates = useTemplates();
  const hasContent = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-medium text-slate-700">{label}</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {templates && hasContent && (
            <button
              type="button"
              onClick={() => {
                const { text, fromSelection } = extractSelectionOrFullText(
                  textareaRef.current,
                  value
                );
                templates.openSaveTemplate({
                  fieldLabel: label,
                  suggestedCategory: 'wnioski_ewaluacja',
                  initialContent: text,
                  fromSelection,
                });
              }}
              title="Zapisz treść lub zaznaczony fragment jako szablon własny"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-blue-900" />
              <span>Zapisz jako szablon</span>
            </button>
          )}
          {templates && (
            <button
              type="button"
              onClick={() =>
                templates.openTemplatePicker({
                  fieldLabel: label,
                  suggestedCategory: 'wnioski_ewaluacja',
                  onApply: (text, mode) =>
                    onChange(applyTemplateInsertion(value, text, mode)),
                })
              }
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-900" />
              <span>
                Szablony własne
                {templates.templatesCount > 0 ? ` (${templates.templatesCount})` : ''}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Wstaw z bazy wniosków</span>
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={textareaClass}
      />
    </div>
  );
};

interface FormTopBarProps {
  docTitle: string;
  metaText: string;
  onResetDoc: () => void;
}

export const FormTopBar: React.FC<FormTopBarProps> = ({ docTitle, metaText, onResetDoc }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{metaText}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-slate-900 truncate">{docTitle}</h2>
    </div>
    <button
      type="button"
      onClick={onResetDoc}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>Wyczyść kartę</span>
    </button>
  </div>
);
