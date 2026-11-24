import React, { useMemo, useState } from 'react';
import {
  Copy,
  FilePlus2,
  FileText,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  DOCUMENT_TYPE_LABELS,
  DocumentType,
  ReportDocument,
  SPECIALIST_ROLE_LABELS,
  SpecialistRole,
} from '../types/reports';

interface DocumentSidebarProps {
  documents: ReportDocument[];
  activeDocumentId: string | null;
  printMode: 'active' | 'all';
  onChangePrintMode: (mode: 'active' | 'all') => void;
  onSelectDocument: (id: string) => void;
  onAddDocument: (
    type: DocumentType,
    options?: { specialistRole?: SpecialistRole; coordinatorMode?: 'przedmiotowy' | 'wczesnoszkolna' }
  ) => void;
  onDuplicateDocument: (id: string) => void;
  onRequestDeleteDocument: (doc: ReportDocument) => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  activeDocumentId,
  printMode,
  onChangePrintMode,
  onSelectDocument,
  onAddDocument,
  onDuplicateDocument,
  onRequestDeleteDocument,
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => {
      const title = (doc.title || '').toLowerCase();
      const typeLabel = DOCUMENT_TYPE_LABELS[doc.type].toLowerCase();
      const roleLabel =
        doc.type === 'podsumowanie_specjalisty'
          ? SPECIALIST_ROLE_LABELS[doc.role].toLowerCase()
          : '';
      return title.includes(q) || typeLabel.includes(q) || roleLabel.includes(q);
    });
  }, [documents, searchQuery]);

  const handleCreate = (
    type: DocumentType,
    options?: { specialistRole?: SpecialistRole; coordinatorMode?: 'przedmiotowy' | 'wczesnoszkolna' }
  ) => {
    onAddDocument(type, options);
    setShowNewMenu(false);
  };

  return (
    <aside className="w-full lg:w-[280px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col no-print">
      {/* Add New Document Button + Dropdown */}
      <div className="p-4 border-b border-slate-200 relative">
        <button
          type="button"
          onClick={() => setShowNewMenu((v) => !v)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          <span>Dodaj nowy dokument</span>
        </button>

        {showNewMenu && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg space-y-1 z-20">
            <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              Wybierz typ formularza:
            </p>
            <button
              type="button"
              onClick={() => handleCreate('efekty_nauczania')}
              className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
            >
              1. Karta efektów nauczania (przedmiot / klasa)
            </button>
            <button
              type="button"
              onClick={() =>
                handleCreate('zbiorcze_efekty', { coordinatorMode: 'przedmiotowy' })
              }
              className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
            >
              2a. Zbiorcze sprawozdanie (koordynator przedmiotowy)
            </button>
            <button
              type="button"
              onClick={() =>
                handleCreate('zbiorcze_efekty', { coordinatorMode: 'wczesnoszkolna' })
              }
              className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
            >
              2b. Zbiorcze sprawozdanie (edukacja wczesnoszkolna I–III)
            </button>
            <button
              type="button"
              onClick={() => handleCreate('karta_informacyjna')}
              className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
            >
              3. Karta informacyjna nauczyciela
            </button>

            <div className="border-t border-slate-100 my-1 pt-1">
              <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                4. Podsumowania specjalistów i komórek:
              </p>
              {(Object.keys(SPECIALIST_ROLE_LABELS) as SpecialistRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    handleCreate('podsumowanie_specjalisty', { specialistRole: role })
                  }
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  {SPECIALIST_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div className="px-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            Dokumenty w sesji (
            {searchQuery.trim()
              ? `${filteredDocuments.length}/${documents.length}`
              : documents.length}
            )
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po tytule lub typie..."
            aria-label="Szukaj dokumentów po tytule lub typie"
            className="w-full rounded-lg border border-slate-300 bg-slate-50/70 pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:bg-white focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Brak kart w sesji. Kliknij „Dodaj nowy dokument”, aby rozpocząć.
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 space-y-2">
            <p>Brak dokumentów pasujących do frazy „{searchQuery.trim()}”.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-blue-900 font-semibold hover:underline cursor-pointer"
            >
              Wyczyść filtr
            </button>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                className={`group rounded-lg border transition-colors ${
                  isActive
                    ? 'border-blue-900 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDocument(doc.id)}
                  className="w-full px-3 py-2.5 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <FileText
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isActive ? 'text-blue-900' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-blue-950' : 'text-slate-900'
                        }`}
                      >
                        {doc.title || DOCUMENT_TYPE_LABELS[doc.type]}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-end gap-1 border-t border-slate-100 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => onDuplicateDocument(doc.id)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    title="Duplikuj kartę (np. dla kolejnej klasy)"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplikuj</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeleteDocument(doc)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    title="Usuń kartę"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Usuń</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print scope selector */}
      <div className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Printer className="w-3.5 h-3.5 text-blue-900" />
          <span>Zakres wydruku / PDF</span>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => onChangePrintMode('active')}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              printMode === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bieżąca karta
          </button>
          <button
            type="button"
            onClick={() => onChangePrintMode('all')}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              printMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Komplet ({documents.length})
          </button>
        </div>
      </div>
    </aside>
  );
};
