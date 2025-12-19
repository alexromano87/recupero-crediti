import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  DollarSign,
  Percent,
  Eye,
  Lock,
} from 'lucide-react';
import { fetchDashboardCondivisa, type DashboardCondivisa } from '../api/dashboard';

export function DashboardCondivisaPage() {
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');

  const [data, setData] = useState<DashboardCondivisa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteId) {
      setError('ID cliente non specificato');
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [clienteId]);

  const loadDashboard = async () => {
    if (!clienteId) return;

    try {
      setLoading(true);
      const dashboardData = await fetchDashboardCondivisa(clienteId);
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      console.error('Errore caricamento dashboard condivisa:', err);
      setError(err.message || 'Errore nel caricamento della dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-900/30">
          <Lock className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-100 mb-2">
            Accesso non consentito
          </h2>
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {error || 'Dashboard non disponibile'}
          </p>
        </div>
      </div>
    );
  }

  const { cliente, configurazione, stats, kpi } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Dashboard {cliente.ragioneSociale}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualizzazione delle informazioni condivise dal tuo studio legale
          </p>
        </div>

        {/* Stats Section */}
        {configurazione.dashboard.stats && stats && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 px-1">
              Statistiche Generali
            </h2>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Pratiche Totali */}
              <div className="group cursor-pointer rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 shadow-lg transition hover:shadow-xl dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-100">Pratiche Totali</p>
                    <p className="mt-2 text-3xl font-bold text-white">{stats.numeroPratiche}</p>
                  </div>
                  <FileText className="h-10 w-10 text-indigo-200" />
                </div>
                <div className="mt-4 flex gap-3 text-xs text-indigo-100">
                  <span>Aperte: {stats.praticheAperte}</span>
                  <span>Chiuse: {stats.praticheChiuse}</span>
                </div>
              </div>

              {/* Capitale */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Capitale</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {formatCurrency(stats.capitaleRecuperato)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Affidato:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(stats.capitaleAffidato)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Recupero:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPercent(stats.percentualeRecuperoCapitale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interessi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interessi</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {formatCurrency(stats.interessiRecuperati)}
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Affidati:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(stats.interessiAffidati)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Recupero:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatPercent(stats.percentualeRecuperoInteressi)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compensi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Compensi</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {formatCurrency(stats.compensiRecuperati)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Affidati:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(stats.compensiAffidati)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Recupero:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {formatPercent(stats.percentualeRecuperoCompensi)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pratiche Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Pratiche Chiuse
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Esito Positivo</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.praticheChiusePositive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Esito Negativo</span>
                    </div>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      {stats.praticheChiuseNegative}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Anticipazioni
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Affidate:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(stats.anticipazioniAffidate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Recuperate:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(stats.anticipazioniRecuperate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">% Recupero:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatPercent(stats.percentualeRecuperoAnticipazioni)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Section */}
        {configurazione.dashboard.kpi && kpi && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 px-1">
              Indicatori di Performance (KPI)
            </h2>

            {/* Performance Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg dark:border-emerald-800">
                <p className="text-sm font-medium text-emerald-100">Tasso di Chiusura</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  {formatPercent(kpi.percentualeChiusura)}
                </p>
                <p className="mt-2 text-xs text-emerald-100">
                  {kpi.totalePraticheChiuse} su {kpi.totalePraticheAffidate} pratiche
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg dark:border-blue-800">
                <p className="text-sm font-medium text-blue-100">Esiti Positivi</p>
                <p className="mt-2 text-4xl font-bold text-white">{kpi.esitoPositivo}</p>
                <div className="mt-2 flex gap-3 text-xs text-blue-100">
                  <span>Totale: {kpi.esitoPositivoTotale}</span>
                  <span>Parziale: {kpi.esitoPositivoParziale}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-500 to-rose-600 p-6 shadow-lg dark:border-rose-800">
                <p className="text-sm font-medium text-rose-100">Esiti Negativi</p>
                <p className="mt-2 text-4xl font-bold text-white">{kpi.esitoNegativo}</p>
                <p className="mt-2 text-xs text-rose-100">Nessun recupero</p>
              </div>
            </div>

            {/* Detailed Recovery KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Recupero Capitale
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Importo totale:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(kpi.recuperoCapitale.totale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Completo:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {kpi.recuperoCapitale.completo} pratiche
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Parziale:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {kpi.recuperoCapitale.parziale} pratiche
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Recupero Interessi
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Importo totale:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(kpi.recuperoInteressi.totale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Completo:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {kpi.recuperoInteressi.completo} pratiche
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Parziale:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {kpi.recuperoInteressi.parziale} pratiche
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Recupero Compensi
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Importo totale:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(kpi.recuperoCompensi.totale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Completo:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {kpi.recuperoCompensi.completo} pratiche
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Parziale:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {kpi.recuperoCompensi.parziale} pratiche
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium mb-1">Informazioni sulla Dashboard</p>
              <p>
                Questa dashboard mostra le informazioni che lo studio legale ha scelto di condividere con te.
                I dati vengono aggiornati in tempo reale e riflettono lo stato attuale delle tue pratiche.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
