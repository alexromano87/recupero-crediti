// apps/frontend/src/components/ui/SearchableClienteSelect.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Building2, Check, ChevronDown } from 'lucide-react';
import type { Cliente } from '../../api/clienti';

export interface SearchableClienteSelectProps {
  clienti: Cliente[];
  selectedClienteId: string | null;
  onSelect: (clienteId: string | null) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchableClienteSelect({
  clienti,
  selectedClienteId,
  onSelect,
  loading = false,
  disabled = false,
  placeholder = 'Cerca cliente...',
  className = '',
}: SearchableClienteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cliente selezionato
  const selectedCliente = useMemo(
    () => clienti.find((c) => c.id === selectedClienteId) ?? null,
    [clienti, selectedClienteId],
  );

  // Filtra clienti in base al termine di ricerca
  const filteredClienti = useMemo(() => {
    if (!searchTerm.trim()) return clienti;

    const term = searchTerm.toLowerCase().trim();
    return clienti.filter((c) => {
      // Cerca in ragione sociale
      if (c.ragioneSociale?.toLowerCase().includes(term)) return true;
      // Cerca in partita IVA (rimuovi spazi e punti per matching flessibile)
      if (c.partitaIva?.replace(/[\s.]/g, '').includes(term.replace(/[\s.]/g, '')))
        return true;
      // Cerca in codice fiscale
      if (c.codiceFiscale?.toLowerCase().includes(term)) return true;
      // Cerca in città
      if (c.citta?.toLowerCase().includes(term)) return true;
      return false;
    });
  }, [clienti, searchTerm]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sull'input quando si apre il dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (cliente: Cliente) => {
    onSelect(cliente.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 dark:disabled:bg-slate-800"
      >
        {loading ? (
          <span className="text-slate-400 dark:text-slate-500">Caricamento clienti...</span>
        ) : selectedCliente ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                {selectedCliente.ragioneSociale}
              </span>
              {selectedCliente.partitaIva && (
                <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  P.IVA {selectedCliente.partitaIva}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {selectedCliente && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* Search Input */}
          <div className="border-b border-slate-200 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cerca per nome, P.IVA, CF o città..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/30"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredClienti.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? 'Nessun cliente trovato per questa ricerca'
                  : 'Nessun cliente disponibile'}
              </div>
            ) : (
              <ul className="py-1">
                {filteredClienti.map((cliente) => {
                  const isSelected = cliente.id === selectedClienteId;
                  return (
                    <li key={cliente.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(cliente)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Building2 className="h-3 w-3" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-medium ${
                              isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {cliente.ragioneSociale}
                          </p>
                          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {[
                              cliente.partitaIva && `P.IVA ${cliente.partitaIva}`,
                              cliente.codiceFiscale && `CF ${cliente.codiceFiscale}`,
                              cliente.citta,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>

                        {!cliente.attivo && (
                          <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-medium uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            Disattivato
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer con conteggio */}
          {filteredClienti.length > 0 && (
            <div className="border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {filteredClienti.length === clienti.length
                ? `${clienti.length} clienti totali`
                : `${filteredClienti.length} di ${clienti.length} clienti`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}