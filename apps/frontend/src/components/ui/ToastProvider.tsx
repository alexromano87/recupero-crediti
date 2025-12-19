// apps/frontend/src/components/ui/ToastProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
};

type ShowToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
};

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const { type = 'info', title, message, duration = 3500 } = options;
      const id = Date.now() + Math.random();

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, title = 'Operazione completata') =>
      showToast({ type: 'success', title, message }),
    [showToast],
  );

  const error = useCallback(
    (message: string, title = 'Si è verificato un errore') =>
      showToast({ type: 'error', title, message, duration: 5000 }),
    [showToast],
  );

  const info = useCallback(
    (message: string, title = 'Informazione') =>
      showToast({ type: 'info', title, message }),
    [showToast],
  );

  const value: ToastContextValue = {
    showToast,
    success,
    error,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Container toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          const borderClass = isSuccess
            ? 'border-emerald-300/70 dark:border-emerald-500/60'
            : isError
              ? 'border-rose-300/70 dark:border-rose-500/60'
              : 'border-sky-300/70 dark:border-sky-500/60';

          const ringClass = isSuccess
            ? 'ring-emerald-200/60 dark:ring-emerald-700/70'
            : isError
              ? 'ring-rose-200/60 dark:ring-rose-700/70'
              : 'ring-sky-200/60 dark:ring-sky-700/70';

          const Icon = isSuccess
            ? CheckCircle2
            : isError
              ? AlertCircle
              : Info;

          return (
            <div
              key={toast.id}
              className={[
                'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs shadow-xl backdrop-blur-md transition-all duration-200',
                'bg-white/90 dark:bg-slate-950/95',
                borderClass,
                'ring-1',
                ringClass,
              ].join(' ')}
            >
              <div
                className={[
                  'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full',
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200'
                    : isError
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/80 dark:text-sky-200',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 space-y-0.5">
                {toast.title && (
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                    {toast.title}
                  </p>
                )}
                <p className="text-[11px] leading-snug text-slate-700 dark:text-slate-200">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-900/70 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // fallback per sicurezza, così non esplode se dimentichi il provider
    return {
      showToast: (_: ShowToastOptions) => {},
      success: (_: string, __?: string) => {},
      error: (_: string, __?: string) => {},
      info: (_: string, __?: string) => {},
    } satisfies ToastContextValue;
  }
  return ctx;
}
