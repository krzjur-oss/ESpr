import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { SubjectAssignment, TeacherProfile } from '../../types/reports';
import { scoreClassScopeMatch } from '../../utils/documentFactory';
import { inputClass } from './FormPrimitives';

export interface ProfileComboOption {
  value: string;
  label?: string;
  subtitle?: string;
  meta?: {
    programNumber?: string;
    textbookNumber?: string;
    textbookTitle?: string;
    classScope?: string;
  };
}

interface ProfileComboInputProps {
  value: string;
  onChange: (value: string) => void;
  options: ProfileComboOption[];
  placeholder?: string;
  className?: string;
  dropdownHeader?: string;
  onSelectOption?: (option: ProfileComboOption) => void;
}

export const ProfileComboInput: React.FC<ProfileComboInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  dropdownHeader = 'Zapisane w Profilu',
  onSelectOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllMode, setShowAllMode] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  const visibleOptions = useMemo(() => {
    if (showAllMode || !value.trim()) return options;
    const q = value.trim().toLowerCase();
    return options.filter((opt) => {
      const label = (opt.label ?? opt.value).toLowerCase();
      const subtitle = (opt.subtitle ?? '').toLowerCase();
      return label.includes(q) || subtitle.includes(q) || opt.value.toLowerCase().includes(q);
    });
  }, [options, showAllMode, value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (opt: ProfileComboOption) => {
    if (onSelectOption) {
      onSelectOption(opt);
    } else {
      onChange(opt.value);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setShowAllMode(true);
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (visibleOptions.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % visibleOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && visibleOptions.length > 0) {
        setHighlightedIndex((prev) => (prev <= 0 ? visibleOptions.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter' && isOpen && highlightedIndex >= 0 && visibleOptions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(visibleOptions[highlightedIndex]);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const hasOptions = options.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          if (hasOptions) {
            setShowAllMode(false);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }
        }}
        onFocus={() => {
          if (hasOptions && !value.trim()) {
            setShowAllMode(true);
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className ?? inputClass} ${hasOptions ? 'pr-9' : ''}`}
      />

      {hasOptions && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={dropdownHeader}
          title={dropdownHeader}
          onClick={() => {
            setShowAllMode(true);
            setIsOpen((prev) => !prev);
            setHighlightedIndex(-1);
          }}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-blue-900' : ''}`}
          />
        </button>
      )}

      {isOpen && visibleOptions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg custom-scrollbar"
        >
          <div className="sticky top-0 border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
            {dropdownHeader}
          </div>
          <div className="py-1">
            {visibleOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-blue-50 text-blue-900'
                      : isSelected
                        ? 'bg-slate-50 text-blue-900'
                        : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="mt-0.5 w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-900" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">
                      {opt.label ?? opt.value}
                    </p>
                    {opt.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {opt.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function dedupeOptions(items: ProfileComboOption[]): ProfileComboOption[] {
  const seen = new Set<string>();
  const result: ProfileComboOption[] = [];
  for (const item of items) {
    const key = item.value.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    result.push({ ...item, value: key });
  }
  return result;
}

function rankAssignments(
  assignments: SubjectAssignment[],
  subject?: string,
  className?: string
): SubjectAssignment[] {
  const normSubj = subject?.trim().toLowerCase() ?? '';
  const trimmedClass = className?.trim() ?? '';

  return [...assignments].sort((a, b) => {
    const aSubjMatch = normSubj && a.subject.trim().toLowerCase() === normSubj ? 1 : 0;
    const bSubjMatch = normSubj && b.subject.trim().toLowerCase() === normSubj ? 1 : 0;
    if (aSubjMatch !== bSubjMatch) return bSubjMatch - aSubjMatch;

    if (trimmedClass) {
      const aScore = scoreClassScopeMatch(a.classScope ?? '', trimmedClass);
      const bScore = scoreClassScopeMatch(b.classScope ?? '', trimmedClass);
      if (aScore !== bScore) return bScore - aScore;
    }

    return 0;
  });
}

function formatAssignmentSubtitle(a: SubjectAssignment, extra?: string): string | undefined {
  const parts: string[] = [];
  if (a.subject.trim()) {
    parts.push(
      a.classScope?.trim() ? `${a.subject.trim()} (kl. ${a.classScope.trim()})` : a.subject.trim()
    );
  } else if (a.classScope?.trim()) {
    parts.push(`kl. ${a.classScope.trim()}`);
  }
  if (extra) parts.push(extra);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function getProfileSubjectOptions(profile: TeacherProfile): ProfileComboOption[] {
  const grouped = new Map<string, SubjectAssignment[]>();
  for (const a of profile.subjectAssignments) {
    const subj = a.subject.trim();
    if (!subj) continue;
    const key = subj.toLowerCase();
    const list = grouped.get(key) ?? [];
    list.push(a);
    grouped.set(key, list);
  }

  const fromAssignments: ProfileComboOption[] = Array.from(grouped.values())
    .filter((items) => items.length > 0)
    .map((items) => {
      const subjectName = items[0]?.subject.trim() ?? '';
      const scopes = Array.from(
        new Set(items.map((i) => i.classScope?.trim()).filter(Boolean))
      );
    const programs = Array.from(
      new Set(items.map((i) => i.programNumber.trim()).filter(Boolean))
    );
    const parts: string[] = [];
    if (scopes.length > 0) parts.push(`kl. ${scopes.join(', ')}`);
    if (programs.length > 0) parts.push(`Prog.: ${programs.join(', ')}`);
    if (items.length > 1) parts.push(`${items.length} warianty`);
    return {
      value: subjectName,
      subtitle: parts.length > 0 ? parts.join(' · ') : undefined,
    };
  });

  const fromList: ProfileComboOption[] = profile.subjectsList.map((s) => ({
    value: s.trim(),
  }));

  return dedupeOptions([...fromAssignments, ...fromList]);
}

export function getProfileClassOptions(
  profile: TeacherProfile,
  extra?: ProfileComboOption[]
): ProfileComboOption[] {
  const items: ProfileComboOption[] = [];
  const homeroom = profile.homeroomClass.trim();
  if (homeroom && !['brak', 'nie dotyczy', '-'].includes(homeroom.toLowerCase())) {
    items.push({
      value: homeroom,
      subtitle: 'Wychowawstwo w Profilu',
    });
  }
  for (const cls of profile.classesList) {
    items.push({ value: cls.trim() });
  }
  if (extra) items.push(...extra);
  return dedupeOptions(items);
}

export function getProfileProgramOptions(
  profile: TeacherProfile,
  subject?: string,
  className?: string
): ProfileComboOption[] {
  const ranked = rankAssignments(profile.subjectAssignments, subject, className);
  return dedupeOptions(
    ranked
      .filter((a) => a.programNumber.trim().length > 0)
      .map((a) => ({
        value: a.programNumber.trim(),
        subtitle: formatAssignmentSubtitle(a),
        meta: {
          programNumber: a.programNumber.trim(),
          textbookNumber: a.textbookNumber?.trim() ?? '',
          textbookTitle: a.textbookTitle.trim(),
          classScope: a.classScope?.trim() ?? '',
        },
      }))
  );
}

export function getProfileTextbookNumberOptions(
  profile: TeacherProfile,
  subject?: string,
  className?: string
): ProfileComboOption[] {
  const ranked = rankAssignments(profile.subjectAssignments, subject, className);
  return dedupeOptions(
    ranked
      .filter((a) => (a.textbookNumber ?? '').trim().length > 0)
      .map((a) => ({
        value: (a.textbookNumber ?? '').trim(),
        subtitle: formatAssignmentSubtitle(
          a,
          a.textbookTitle.trim() ? a.textbookTitle.trim() : undefined
        ),
        meta: {
          programNumber: a.programNumber.trim(),
          textbookNumber: (a.textbookNumber ?? '').trim(),
          textbookTitle: a.textbookTitle.trim(),
          classScope: a.classScope?.trim() ?? '',
        },
      }))
  );
}

export function getProfileTextbookOptions(
  profile: TeacherProfile,
  subject?: string,
  className?: string
): ProfileComboOption[] {
  const ranked = rankAssignments(profile.subjectAssignments, subject, className);
  return dedupeOptions(
    ranked
      .filter((a) => a.textbookTitle.trim().length > 0)
      .map((a) => ({
        value: a.textbookTitle.trim(),
        subtitle: formatAssignmentSubtitle(
          a,
          (a.textbookNumber ?? '').trim() ? `Nr: ${(a.textbookNumber ?? '').trim()}` : undefined
        ),
        meta: {
          programNumber: a.programNumber.trim(),
          textbookNumber: (a.textbookNumber ?? '').trim(),
          textbookTitle: a.textbookTitle.trim(),
          classScope: a.classScope?.trim() ?? '',
        },
      }))
  );
}

export function getProfileTeacherOptions(
  profile: TeacherProfile,
  extraNames: string[] = []
): ProfileComboOption[] {
  const items: ProfileComboOption[] = [];
  if (profile.fullName.trim()) {
    items.push({ value: profile.fullName.trim(), subtitle: 'Dane z Profilu' });
  }
  for (const name of extraNames) {
    if (name.trim()) {
      items.push({ value: name.trim(), subtitle: 'Z wypełnionych kart' });
    }
  }
  return dedupeOptions(items);
}

export function getProfileSchoolOptions(profile: TeacherProfile): ProfileComboOption[] {
  return dedupeOptions(
    profile.schoolName.trim()
      ? [{ value: profile.schoolName.trim(), subtitle: 'Szkoła z Profilu' }]
      : []
  );
}

export function getProfileYearOptions(
  profile: TeacherProfile,
  availableYears: string[] = []
): ProfileComboOption[] {
  const items: ProfileComboOption[] = [];
  if (profile.schoolYear.trim()) {
    items.push({ value: profile.schoolYear.trim(), subtitle: 'Bieżący rok w Profilu' });
  }
  for (const y of availableYears) {
    if (y && y !== 'Bez roku') {
      items.push({ value: y, subtitle: 'Rok z archiwum' });
    }
  }
  return dedupeOptions(items);
}

export function getProfileDateOptions(profile: TeacherProfile): ProfileComboOption[] {
  const today = new Date().toLocaleDateString('pl-PL');
  const items: ProfileComboOption[] = [];
  if (profile.signatureDate.trim()) {
    items.push({ value: profile.signatureDate.trim(), subtitle: 'Domyślna data z Profilu' });
  }
  items.push({ value: today, subtitle: 'Dzisiejsza data' });
  return dedupeOptions(items);
}
