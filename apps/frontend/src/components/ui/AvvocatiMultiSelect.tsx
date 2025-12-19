// apps/frontend/src/components/ui/AvvocatiMultiSelect.tsx
import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { getAvvocatoDisplayName, type Avvocato } from '../../api/avvocati';

interface AvvocatiMultiSelectProps {
  avvocati: Avvocato[] | undefined;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function AvvocatiMultiSelect({
  avvocati,
  selectedIds,
  onChange,
  loading = false,
  disabled = false,
  placeholder = 'Seleziona avvocati...',
}: AvvocatiMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Gestione difensiva per evitare errori se avvocati è undefined
  const safeAvvocati = avvocati || [];
  const selectedAvvocati = safeAvvocati.filter((a) => selectedIds.includes(a.id));
  const availableAvvocati = safeAvvocati.filter((a) => !selectedIds.includes(a.id) && a.attivo);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="relative">
      <div
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`min-h-[40px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition cursor-pointer
          ${disabled || loading ? 'cursor-not-allowed opacity-50' : 'hover:border-indigo-400'}
          ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-300'}
          dark:border-slate-600 dark:bg-slate-800`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedAvvocati.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          ) : (
            selectedAvvocati.map((avv) => (
              <span
                key={avv.id}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
              >
                {getAvvocatoDisplayName(avv)}
                <button
                  onClick={(e) => handleRemove(avv.id, e)}
                  className="hover:text-indigo-900 dark:hover:text-indigo-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown
            className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && !disabled && !loading && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 max-h-60 overflow-auto">
            {availableAvvocati.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">
                {safeAvvocati.length === 0 ? 'Nessun avvocato disponibile' : 'Tutti gli avvocati sono stati selezionati'}
              </div>
            ) : (
              availableAvvocati.map((avv) => (
                <button
                  key={avv.id}
                  onClick={() => handleToggle(avv.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {getAvvocatoDisplayName(avv)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{avv.email}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
