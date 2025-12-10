// apps/frontend/src/components/ui/CustomSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleziona...',
  disabled = false,
  loading = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-xs shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {loading ? (
          <span className="text-slate-400 dark:text-slate-500">Caricamento...</span>
        ) : selectedOption ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectedOption.icon}
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
          {/* Results List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Nessuna opzione disponibile
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition ${
                      option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-medium ${
                          isSelected
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {option.sublabel}
                        </p>
                      )}
                    </div>

                    {option.icon && (
                      <div className="shrink-0">{option.icon}</div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}