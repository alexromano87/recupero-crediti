import { useEffect, useState } from 'react';
import {
  auditLogsApi,
  type AuditLog,
  type AuditLogFilters,
  type AuditLogStats,
  type AuditAction,
  type AuditEntity,
} from '../api/audit-logs';
import { Download, FileText, AlertCircle, CheckCircle, XCircle, Filter, X } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtri
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogsApi.getLogs(filters);
      setLogs(response.logs);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei log');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { userId, studioId, startDate, endDate } = filters;
      const response = await auditLogsApi.getStats({ userId, studioId, startDate, endDate });
      setStats(response);
    } catch (err: any) {
      console.error('Errore nel caricamento delle statistiche:', err);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await auditLogsApi.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'esportazione');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  const getActionBadgeColor = (action: AuditAction) => {
    const colors: Record<string, string> = {
      LOGIN: 'bg-blue-100 text-blue-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      LOGIN_FAILED: 'bg-red-100 text-red-800',
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      TOGGLE_ACTIVE: 'bg-purple-100 text-purple-800',
      EXPORT: 'bg-indigo-100 text-indigo-800',
      DOWNLOAD: 'bg-indigo-100 text-indigo-800',
      UPLOAD: 'bg-indigo-100 text-indigo-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: AuditAction) => {
    const labels: Record<AuditAction, string> = {
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      LOGIN_FAILED: 'Login Fallito',
      CREATE: 'Creazione',
      UPDATE: 'Modifica',
      DELETE: 'Eliminazione',
      TOGGLE_ACTIVE: 'Attivazione/Disattivazione',
      RESET_PASSWORD: 'Reset Password',
      CHANGE_PASSWORD: 'Cambio Password',
      ASSIGN_STUDIO: 'Assegnazione Studio',
      EXPORT: 'Esportazione',
      IMPORT: 'Importazione',
      DOWNLOAD: 'Download',
      UPLOAD: 'Upload',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: AuditEntity) => {
    const labels: Record<AuditEntity, string> = {
      USER: 'Utente',
      STUDIO: 'Studio',
      CLIENTE: 'Cliente',
      DEBITORE: 'Debitore',
      PRATICA: 'Pratica',
      AVVOCATO: 'Avvocato',
      MOVIMENTO_FINANZIARIO: 'Movimento Finanziario',
      ALERT: 'Alert',
      TICKET: 'Ticket',
      DOCUMENTO: 'Documento',
      CARTELLA: 'Cartella',
      FASE: 'Fase',
    };
    return labels[entity] || entity;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Log di Audit</h1>
          <p className="text-gray-600">Registro completo delle attività della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Nascondi Filtri' : 'Mostra Filtri'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Esportazione...' : 'Esporta CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Statistiche */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Totale Log</h3>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Operazioni Riuscite</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.successCount}</div>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? ((stats.successCount / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Operazioni Fallite</h3>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failureCount}</div>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? ((stats.failureCount / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Filtri */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Filtri</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Pulisci Filtri
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-1">Azione</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">Tutte</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="LOGIN_FAILED">Login Fallito</option>
                <option value="CREATE">Creazione</option>
                <option value="UPDATE">Modifica</option>
                <option value="DELETE">Eliminazione</option>
                <option value="TOGGLE_ACTIVE">Attivazione/Disattivazione</option>
                <option value="EXPORT">Esportazione</option>
                <option value="DOWNLOAD">Download</option>
                <option value="UPLOAD">Upload</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Entità</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.entityType || ''}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              >
                <option value="">Tutte</option>
                <option value="USER">Utente</option>
                <option value="STUDIO">Studio</option>
                <option value="CLIENTE">Cliente</option>
                <option value="DEBITORE">Debitore</option>
                <option value="PRATICA">Pratica</option>
                <option value="AVVOCATO">Avvocato</option>
                <option value="MOVIMENTO_FINANZIARIO">Movimento Finanziario</option>
                <option value="ALERT">Alert</option>
                <option value="TICKET">Ticket</option>
                <option value="DOCUMENTO">Documento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Inizio</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Fine</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Esito</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.success === undefined ? '' : filters.success ? 'true' : 'false'}
                onChange={(e) =>
                  handleFilterChange('success', e.target.value === '' ? undefined : e.target.value === 'true')
                }
              >
                <option value="">Tutti</option>
                <option value="true">Riuscito</option>
                <option value="false">Fallito</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ricerca</label>
              <input
                type="text"
                placeholder="Cerca in descrizione, entità, email..."
                className="w-full p-2 border rounded"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabella Log */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            Log di Audit ({total} totali)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Data/Ora</th>
                <th className="text-left p-4 font-medium text-gray-700">Utente</th>
                <th className="text-left p-4 font-medium text-gray-700">Azione</th>
                <th className="text-left p-4 font-medium text-gray-700">Entità</th>
                <th className="text-left p-4 font-medium text-gray-700">Descrizione</th>
                <th className="text-center p-4 font-medium text-gray-700">Esito</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-sm">
                    {new Date(log.createdAt).toLocaleString('it-IT')}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {log.user ? (
                        <>
                          <p className="font-medium">
                            {log.user.nome} {log.user.cognome}
                          </p>
                          <p className="text-gray-500 text-xs">{log.user.email}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">{log.userEmail || 'Sistema'}</p>
                      )}
                      {log.userRole && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{log.userRole}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium">{getEntityLabel(log.entityType)}</p>
                      {log.entityName && (
                        <p className="text-gray-500 text-xs">{log.entityName}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm max-w-md">
                    <p className="truncate">{log.description || '-'}</p>
                    {log.errorMessage && (
                      <p className="text-red-600 text-xs mt-1">{log.errorMessage}</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {log.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 inline" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Pagina {page} di {totalPages} ({total} log totali)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('page', page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Precedente
              </button>
              <button
                onClick={() => handleFilterChange('page', page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
