import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, GitCompare, X } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '../types/reports';
import {
  DocumentVersionDiff,
  PackageDiffResult,
  getDocumentSubtitleForDiff,
  resolvePackageTeacherName,
} from '../utils/supervision';

interface SupervisionDiffModalProps {
  diff: PackageDiffResult | null;
  queueIndex: number;
  queueTotal: number;
  onResolve: (decisions: Record<string, 'incoming' | 'existing'>) => void;
  onSkip: () => void;
}

export const SupervisionDiffModal: React.FC<SupervisionDiffModalProps> = ({
  diff,
  queueIndex,
  queueTotal,
  onResolve,
  onSkip,
}) => {
  const [decisions, setDecisions] = useState<Record<string, 'incoming' | 'existing'>>({});

  useEffect(() => {
    if (!diff) return;
    const initial: Record<string, 'incoming' | 'existing'> = {};
    for (const item of diff.documentDiffs) {
      if (item.status !== 'unchanged') {
        initial[item.key] = 'incoming';
      }
    }
    setDecisions(initial);
  }, [diff]);

  if (!diff) return null;

  const teacherName = resolvePackageTeacherName(diff.incomingPackage);
  const changedItems = diff.documentDiffs.filter((d) => d.status !== 'unchanged');

  const setAll = (choice: 'incoming' | 'existing') => {
    const next: Record<string, 'incoming' | 'existing'> = {};
    for (const item of changedItems) {
      next[item.key] = choice;
    }
    setDecisions(next);
  };

  const renderStatusLabel = (item: DocumentVersionDiff) => {
    if (item.status === 'added') {
      return <span className="font-semibold text-emerald-700">Nowa karta w pliku</span>;
    }
    if (item.status === 'removed') {
      return (
        <span className="font-semibold text-red-700">
          Brak tej karty w nowej paczce
        </span>
      );
    }
    return (
      <span className="font-semibold text-amber-700 tabular-nums">
        Zmodyfikowano ({item.changes.length}{' '}
        {item.changes.length === 1 ? 'pole' : item.changes.length <= 4 ? 'pola' : 'pól'})
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervision-diff-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <GitCompare className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 id="supervision-diff-title" className="text-base font-semibold text-slate-900">
                  Porównanie wersji sprawozdań nauczyciela
                </h2>
                {queueTotal > 1 && (
                  <span className="text-xs font-mono-tabular text-slate-500">
                    Pakiet {queueIndex + 1} z {queueTotal}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                Nadawca: <strong className="text-slate-900">{teacherName}</strong>
                {' · '}
                Poprzedni import:{' '}
                <span className="font-mono-tabular">
                  {new Date(diff.existingPackage.exportedAt).toLocaleString('pl-PL')}
                </span>
                {' · '}
                Nowy plik:{' '}
                <span className="font-mono-tabular">
                  {new Date(diff.incomingPackage.exportedAt).toLocaleString('pl-PL')}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Pomiń ten plik"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary strip + bulk decisions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 tabular-nums">
            <span>
              Nowe: <strong className="text-emerald-700">{diff.counts.added}</strong>
            </span>
            <span>
              Zmienione: <strong className="text-amber-700">{diff.counts.modified}</strong>
            </span>
            <span>
              Usunięte w nowym: <strong className="text-red-700">{diff.counts.removed}</strong>
            </span>
            <span>
              Bez zmian: <strong className="text-slate-900">{diff.counts.unchanged}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAll('incoming')}
              className="rounded-md border border-blue-900 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50 cursor-pointer whitespace-nowrap"
            >
              Wybierz wszystkie z nowego pliku
            </button>
            <button
              type="button"
              onClick={() => setAll('existing')}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              Zachowaj wszystkie obecne
            </button>
          </div>
        </div>

        {/* Diff Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
          {diff.profileChanges.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-900">Zmiany w podpisie profilu nadawcy</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {diff.profileChanges.map((ch) => (
                  <div key={ch.field} className="text-slate-700">
                    <span className="font-medium">{ch.label}:</span>{' '}
                    <span className="line-through text-slate-400">{ch.before}</span>{' '}
                    <span aria-hidden="true">→</span>{' '}
                    <strong className="text-slate-900">{ch.after}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {changedItems.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-600">
              Treść wszystkich kart sprawozdań jest identyczna z poprzednią wersją. Zatwierdź, aby zaktualizować podpis i datę importu.
            </div>
          ) : (
            changedItems.map((item) => {
              const targetDoc = item.incomingDoc ?? item.existingDoc!;
              const choice = decisions[item.key] ?? 'incoming';

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 text-xs">
                        <span className="font-semibold text-slate-900">
                          {DOCUMENT_TYPE_LABELS[targetDoc.type]}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        {renderStatusLabel(item)}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 truncate">
                        {getDocumentSubtitleForDiff(targetDoc)}
                      </p>
                    </div>

                    <div className="inline-flex rounded-lg bg-slate-200/70 p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((prev) => ({ ...prev, [item.key]: 'incoming' }))
                        }
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          choice === 'incoming'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {item.status === 'removed'
                          ? 'Usuń z nadzoru'
                          : item.status === 'added'
                            ? 'Dodaj kartę'
                            : 'Wprowadź nową'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((prev) => ({ ...prev, [item.key]: 'existing' }))
                        }
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          choice === 'existing'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {item.status === 'added'
                          ? 'Pomiń nową'
                          : 'Zostaw obecną'}
                      </button>
                    </div>
                  </div>

                  {item.status === 'modified' && item.changes.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/40 text-left text-[11px] font-semibold text-slate-500">
                            <th className="w-44 px-4 py-2">Pole</th>
                            <th className="px-4 py-2">Obecna wersja w nadzorze</th>
                            <th className="px-4 py-2">Nowa wersja z pliku</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {item.changes.map((ch) => (
                            <tr key={ch.field} className="align-top">
                              <td className="px-4 py-2 font-medium text-slate-700">{ch.label}</td>
                              <td className="px-4 py-2 text-slate-600 whitespace-pre-line bg-red-50/25">
                                {ch.before}
                              </td>
                              <td className="px-4 py-2 text-slate-900 whitespace-pre-line bg-emerald-50/30 font-medium">
                                {ch.after}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {item.status === 'removed' && (
                    <div className="px-4 py-2.5 flex items-center gap-2 text-xs text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Poprzednia wersja zawierała tę kartę, ale nie ma jej w nowej paczce. Wybierz, czy zachować ją w nadzorze, czy usunąć.
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
          >
            Pomiń ten plik
          </button>
          <button
            type="button"
            onClick={() => onResolve(decisions)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            <span>Zatwierdź wybrane wersje i przelicz klasy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
