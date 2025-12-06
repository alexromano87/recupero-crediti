import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import {
  Home,
  Users,
  Building2,
  FileText,
  Search,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const mainNav = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/clienti', label: 'Clienti', icon: Users },
  { path: '/debitori', label: 'Debitori', icon: Building2 },
  { path: '/pratiche', label: 'Pratiche', icon: FileText },
  { path: '/ricerca', label: 'Ricerca avanzata', icon: Search },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const currentNav = mainNav.find((n) => n.path === location.pathname);
  const pageTitle = currentNav?.label ?? 'Dashboard';
  const { theme, toggleTheme } = useTheme();


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* sfondo sfumato dietro al layout */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-200 via-slate-50 to-slate-200 opacity-70 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-900" />

      <div className="relative flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="z-10 flex w-72 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-gradient-to-b dark:from-slate-950/95 dark:via-slate-950/90 dark:to-slate-950/80">
          {/* Logo + studio */}
          <div className="flex items-center gap-3 border-b border-slate-200/70 px-6 py-4 dark:border-slate-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold shadow-lg shadow-indigo-900/40">
              RC
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-300">
                Iorlano &amp; Partners
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Gestionale recupero crediti
              </p>
            </div>
          </div>

          {/* Navigazione */}
          <nav className="flex-1 space-y-4 px-3 py-4">
            <div>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Operatività
              </p>
              <ul className="space-y-1">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          [
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-slate-900 text-slate-50 shadow-sm shadow-black/30'
                              : 'text-slate-300 hover:bg-slate-900/70 hover:text-slate-50',
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={[
                                'h-7 w-1 rounded-full bg-indigo-500 transition-all',
                                isActive
                                  ? 'opacity-100 translate-x-0'
                                  : 'opacity-0 -translate-x-1 group-hover:opacity-80 group-hover:translate-x-0',
                              ].join(' ')}
                            />
                            <Icon
                              size={18}
                              className="text-slate-200 group-hover:text-slate-50"
                            />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sistema
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900/70 hover:text-slate-50"
                  >
                    <Settings size={18} className="text-slate-200" />
                    Impostazioni
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer sidebar */}
          <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>v0.1.0 • Dev</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-900/70 hover:text-slate-50"
              >
                <LogOut size={14} />
                Esci
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* HEADER */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">Workspace</span>
                <span className="text-slate-600">/</span>
                <span>{pageTitle}</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-50">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search box globale */}
              <div className="hidden items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm shadow-slate-300/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400 dark:shadow-black/30 sm:flex">
                <Search size={14} className="text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Cerca pratiche, clienti, note..."
                  className="w-56 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <span className="rounded border border-slate-300 px-1.5 py-[1px] text-[10px] text-slate-400 dark:border-slate-600 dark:text-slate-400">
                  ⌘K
                </span>
              </div>

          {/* Toggle giorno/notte */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm shadow-slate-300/60 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-black/30 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
              aria-label="Cambia tema"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifiche */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm shadow-slate-300/60 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-black/30 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              <Bell size={16} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-50 dark:ring-slate-900" />
            </button>
              <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400 shadow-sm shadow-black/30 sm:flex">
                <Search size={14} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Cerca pratiche, clienti, note..."
                  className="w-56 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <span className="rounded border border-slate-600 px-1.5 py-[1px] text-[10px] text-slate-400">
                  ⌘K
                </span>
              </div>

              {/* Notifiche */}
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-slate-300 shadow-sm shadow-black/30 transition-colors hover:border-indigo-500 hover:text-indigo-300"
              >
                <Bell size={16} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
              </button>

              {/* Profilo */}
              <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-xs shadow-sm shadow-black/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-semibold">
                  AR
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-medium text-slate-100">
                    Alessandro Romano
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Admin • Studio legale
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT AREA */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
