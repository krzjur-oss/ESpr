import React from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';

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
}) => (
  <div className="space-y-1.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label className="block text-xs font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={onOpenPicker}
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Wstaw z bazy wniosków</span>
      </button>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={textareaClass}
    />
  </div>
);

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
