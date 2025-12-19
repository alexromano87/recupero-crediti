// apps/frontend/src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, FileText, CheckCircle, XCircle,
  DollarSign, Percent, BarChart3, PieChart, RefreshCw, Filter,
} from 'lucide-react';
import { fetchDashboardStats, fetchDashboardKPI, type DashboardStats, type KPI } from '../api/dashboard';
import { fetchClienti, type Cliente } from '../api/clienti';

export function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpi, setKPI] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtri
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');

  useEffect(() => {
    loadClienti();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedClienteId]);

  const loadClienti = async () => {
    try {
      const data = await fetchClienti();
      setClienti(data);
    } catch (err) {
      console.error('Errore caricamento clienti:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clienteId = selectedClienteId || undefined;
      const [statsData, kpiData] = await Promise.all([
        fetchDashboardStats(clienteId),
        fetchDashboardKPI(clienteId),
      ]);
      setStats(statsData);
      setKPI(kpiData);
    } catch (err) {
      console.error('Errore caricamento dashboard:', err);
      setError('Impossibile caricare i dati della dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !stats || !kpi) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Errore nel caricamento dei dati'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Panoramica completa delle attività di recupero crediti
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
          Aggiorna
        </button>
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Filter className="h-5 w-5 text-slate-400" />
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Filtra per Cliente
          </label>
          <select
            value={selectedClienteId}
            onChange={(e) => setSelectedClienteId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tutti i clienti</option>
            {clienti.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.ragioneSociale}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards - Prima Riga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pratiche Totali */}
        <div
          onClick={() => navigate('/pratiche')}
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-white/80" />
          </div>
          <h3 className="text-sm font-medium text-white/80 mb-1">Pratiche Totali</h3>
          <p className="text-3xl font-bold text-white">{stats.numeroPratiche}</p>
          <p className="text-xs text-white/70 mt-2">
            {stats.praticheAperte} aperte • {stats.praticheChiuse} chiuse
          </p>
        </div>

        {/* Percentuale Chiusura */}
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <BarChart3 className="h-5 w-5 text-white/80" />
          </div>
          <h3 className="text-sm font-medium text-white/80 mb-1">Tasso di Chiusura</h3>
          <p className="text-3xl font-bold text-white">{formatPercent(kpi.percentualeChiusura)}</p>
          <p className="text-xs text-white/70 mt-2">
            {kpi.totalePraticheChiuse} / {kpi.totalePraticheAffidate} pratiche
          </p>
        </div>

        {/* Esiti Positivi */}
        <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-white/80" />
          </div>
          <h3 className="text-sm font-medium text-white/80 mb-1">Esiti Positivi</h3>
          <p className="text-3xl font-bold text-white">{kpi.esitoPositivo}</p>
          <p className="text-xs text-white/70 mt-2">
            {kpi.esitoPositivoTotale} totali • {kpi.esitoPositivoParziale} parziali
          </p>
        </div>

        {/* Esiti Negativi */}
        <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <TrendingDown className="h-5 w-5 text-white/80" />
          </div>
          <h3 className="text-sm font-medium text-white/80 mb-1">Esiti Negativi</h3>
          <p className="text-3xl font-bold text-white">{kpi.esitoNegativo}</p>
          <p className="text-xs text-white/70 mt-2">Nessun recupero</p>
        </div>
      </div>

      {/* Recupero Crediti - Seconda Riga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capitale */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Capitale</h3>
                <p className="text-xs text-slate-500">Recupero capitale</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercent(stats.percentualeRecuperoCapitale)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Affidato</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(stats.capitaleAffidato)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Recuperato</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.capitaleRecuperato)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pratiche recupero completo</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoCapitale.completo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Pratiche recupero parziale</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoCapitale.parziale}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interessi */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Interessi</h3>
                <p className="text-xs text-slate-500">Recupero interessi</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatPercent(stats.percentualeRecuperoInteressi)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Affidati</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(stats.interessiAffidati)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Recuperati</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.interessiRecuperati)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pratiche recupero completo</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoInteressi.completo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Pratiche recupero parziale</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoInteressi.parziale}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compensi e Anticipazioni - Terza Riga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compensi Legali */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Compensi Legali</h3>
                <p className="text-xs text-slate-500">Recupero compensi</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatPercent(stats.percentualeRecuperoCompensi)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Affidati</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(stats.compensiAffidati)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Liquidati</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.compensiRecuperati)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pratiche recupero completo</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoCompensi.completo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Pratiche recupero parziale</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpi.recuperoCompensi.parziale}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Anticipazioni */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Anticipazioni</h3>
                <p className="text-xs text-slate-500">Recupero anticipazioni</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatPercent(stats.percentualeRecuperoAnticipazioni)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Affidate</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(stats.anticipazioniAffidate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Recuperate</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.anticipazioniRecuperate)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 italic">
                Le anticipazioni sono spese sostenute dallo studio per conto del cliente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
