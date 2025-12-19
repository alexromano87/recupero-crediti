// apps/frontend/src/pages/PratichePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { CustomSelect } from '../components/ui/CustomSelect';
import { AvvocatiMultiSelect } from '../components/ui/AvvocatiMultiSelect';
import {
  fetchPratiche,
  createPratica,
  formatCurrency,
  getDebitoreDisplayName,
  type Pratica,
  type PraticaCreatePayload,
} from '../api/pratiche';
import { fetchFasi, type Fase } from '../api/fasi';
import { fetchClienti, type Cliente } from '../api/clienti';
import { fetchDebitoriForCliente, type Debitore } from '../api/debitori';
import { avvocatiApi, type Avvocato } from '../api/avvocati';
import { Pagination } from '../components/Pagination';

const formatoItalianoANumero = (valore: string): number => {
  if (!valore) return 0;
  return parseFloat(String(valore).replace(/\./g, '').replace(',', '.')) || 0;
};

const numeroAFormatoItaliano = (valore: number | string | undefined): string => {
  if (valore === undefined || valore === null || valore === '' || valore === 0) return '';
  const numero = typeof valore === 'string' ? parseFloat(valore) : valore;
  if (isNaN(numero) || numero === 0) return '';
  return numero.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function PratichePage() {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Data states
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [fasi, setFasi] = useState<Fase[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [debitoriForCliente, setDebitoriForCliente] = useState<Debitore[]>([]);
  const [avvocati, setAvvocati] = useState<Avvocato[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Loading states
  const [loadingPratiche, setLoadingPratiche] = useState(true);
  const [loadingClienti, setLoadingClienti] = useState(true);
  const [loadingDebitori, setLoadingDebitori] = useState(false);
  const [loadingAvvocati, setLoadingAvvocati] = useState(true);

  // Filter states
  const [filterClienteId, setFilterClienteId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New pratica form states
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newForm, setNewForm] = useState<PraticaCreatePayload>({
    clienteId: '',
    debitoreId: '',
    capitale: 0,
    anticipazioni: 0,
    compensiLegali: 0,
    interessi: 0,
    dataAffidamento: '',
    note: '',
    avvocatiIds: [],
  });
  const [capitaleInput, setCapitaleInput] = useState('');
  const [noteNuovaPratica, setNoteNuovaPratica] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadPratiche();
    loadFasi();
    loadClienti();
    loadAvvocati();
  }, []);

  // Load debitori when cliente changes in new form
  useEffect(() => {
    if (newForm.clienteId) {
      loadDebitoriForCliente(newForm.clienteId);
    } else {
      setDebitoriForCliente([]);
    }
  }, [newForm.clienteId]);

  const loadPratiche = async () => {
    try {
      setLoadingPratiche(true);
      const data = await fetchPratiche();
      setPratiche(data);
    } catch (err) {
      console.error('Errore caricamento pratiche:', err);
      setError('Impossibile caricare le pratiche');
    } finally {
      setLoadingPratiche(false);
    }
  };

  const loadFasi = async () => {
    try {
      const data = await fetchFasi();
      setFasi(data);
    } catch (err) {
      console.error('Errore caricamento fasi:', err);
    }
  };

  const loadClienti = async () => {
    try {
      setLoadingClienti(true);
      const data = await fetchClienti();
      setClienti(data);
    } catch (err) {
      console.error('Errore caricamento clienti:', err);
    } finally {
      setLoadingClienti(false);
    }
  };

  const loadDebitoriForCliente = async (clienteId: string) => {
    try {
      setLoadingDebitori(true);
      const data = await fetchDebitoriForCliente(clienteId);
      setDebitoriForCliente(data);
    } catch (err) {
      console.error('Errore caricamento debitori:', err);
    } finally {
      setLoadingDebitori(false);
    }
  };

  const loadAvvocati = async () => {
    try {
      setLoadingAvvocati(true);
      const data = await avvocatiApi.getAll();
      setAvvocati(data);
    } catch (err) {
      console.error('Errore caricamento avvocati:', err);
    } finally {
      setLoadingAvvocati(false);
    }
  };

  const updateNewForm = (field: keyof PraticaCreatePayload, value: any) => {
    setNewForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetNewForm = () => {
    setNewForm({
      clienteId: '',
      debitoreId: '',
      capitale: 0,
      anticipazioni: 0,
      compensiLegali: 0,
      interessi: 0,
      dataAffidamento: '',
      note: '',
      avvocatiIds: [],
    });
    setCapitaleInput('');
    setNoteNuovaPratica('');
  };

  const handleCreatePratica = async () => {
    const cliente = clienti.find((c) => c.id === newForm.clienteId);
    const debitore = debitoriForCliente.find((d) => d.id === newForm.debitoreId);
    const clienteNome = cliente?.ragioneSociale || 'Cliente';
    const debitoreNome =
      debitore?.tipoSoggetto === 'persona_fisica'
        ? `${debitore.nome} ${debitore.cognome}`.trim()
        : debitore?.ragioneSociale || 'Debitore';
    const capitaleStr = newForm.capitale
      ? `€ ${newForm.capitale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
      : 'non specificato';

    if (
      await confirm({
        title: 'Conferma apertura',
        message: `Cliente: ${clienteNome}\nDebitore: ${debitoreNome}\nCapitale: ${capitaleStr}`,
        confirmText: 'Apri pratica',
        variant: 'info',
      })
    ) {
      try {
        setSavingNew(true);
        const formData = { ...newForm };
        if (noteNuovaPratica.trim()) formData.note = noteNuovaPratica.trim();

        await createPratica(formData);
        await loadPratiche();
        setShowNewForm(false);
        resetNewForm();
      } catch (err) {
        console.error('Errore creazione pratica:', err);
        alert('Errore durante la creazione della pratica');
      } finally {
        setSavingNew(false);
      }
    }
  };

  const handleFilterByCliente = (clienteId: string | null) => {
    setFilterClienteId(clienteId);
  };

  const getFaseById = (faseId: string): Fase | undefined => {
    return fasi.find((f) => f.id === faseId);
  };

  // Filtered pratiche
  const filteredPratiche = pratiche.filter((p) => {
    // Filter by cliente
    if (filterClienteId && p.clienteId !== filterClienteId) return false;
    // Filter by active status
    if (!showInactive && !p.attivo) return false;
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const clienteMatch = p.cliente?.ragioneSociale?.toLowerCase().includes(search);
      const debitoreMatch = getDebitoreDisplayName(p.debitore).toLowerCase().includes(search);
      if (!clienteMatch && !debitoreMatch) return false;
    }
    return true;
  });

  const debitoreOptions = debitoriForCliente.map((d) => ({
    value: d.id,
    label:
      d.tipoSoggetto === 'persona_fisica' ? `${d.nome} ${d.cognome}`.trim() : d.ragioneSociale || '',
    sublabel: d.tipoSoggetto === 'persona_fisica' ? d.codiceFiscale : d.partitaIva,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Operatività
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Pratiche</h1>
          <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Gestisci le pratiche di recupero crediti. Clicca su una pratica per vederne il dettaglio.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" />
          Nuova pratica
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filtra per cliente
            </label>
            <SearchableClienteSelect
              clienti={clienti}
              loading={loadingClienti}
              value={filterClienteId}
              onChange={handleFilterByCliente}
              placeholder="Tutti i clienti..."
              allowClear
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cerca
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca cliente o debitore..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Opzioni
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1.5">
                  {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Mostra disattivate
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Pratiche Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {filteredPratiche.length} {filteredPratiche.length === 1 ? 'pratica' : 'pratiche'}
          </h2>
          <button
            onClick={loadPratiche}
            disabled={loadingPratiche}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPratiche ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingPratiche ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-3" />
            <span className="text-sm">Caricamento...</span>
          </div>
        ) : filteredPratiche.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessuna pratica trovata</p>
            {(filterClienteId || searchTerm || !showInactive) && (
              <button
                onClick={() => {
                  setFilterClienteId(null);
                  setSearchTerm('');
                  setShowInactive(true);
                }}
                className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Rimuovi filtri
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {filteredPratiche
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((pratica) => {
              const fase = getFaseById(pratica.faseId);
              return (
                <button
                  key={pratica.id}
                  onClick={() => navigate(`/pratiche/${pratica.id}`)}
                  className="text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-16 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fase?.colore || '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {pratica.cliente?.ragioneSociale}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            vs {getDebitoreDisplayName(pratica.debitore)}
                          </p>
                        </div>
                        {!pratica.aperta && (
                          <div
                            className={`p-1 rounded-full ${
                              pratica.esito === 'positivo'
                                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                : 'bg-rose-100 dark:bg-rose-900/50'
                            }`}
                          >
                            {pratica.esito === 'positivo' ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: `${fase?.colore}20`,
                            color: fase?.colore,
                          }}
                        >
                          {fase?.nome || 'N/D'}
                        </span>
                        {!pratica.attivo && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                            Disattivata
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Capitale</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          € {formatCurrency(pratica.capitale)}
                        </span>
                      </div>

                      {pratica.dataAffidamento && (
                        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          Affidamento: {new Date(pratica.dataAffidamento).toLocaleDateString('it-IT')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      Vedi dettaglio →
                    </span>
                  </div>
                </button>
              );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredPratiche.length / ITEMS_PER_PAGE)}
              totalItems={filteredPratiche.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* New Pratica Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              resetNewForm();
              setShowNewForm(false);
            }}
          />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nuova pratica</h2>
              <button
                onClick={() => {
                  resetNewForm();
                  setShowNewForm(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cliente *
                  </label>
                  <SearchableClienteSelect
                    clienti={clienti}
                    loading={loadingClienti}
                    value={newForm.clienteId || null}
                    onChange={(id) => updateNewForm('clienteId', id || '')}
                    placeholder="Seleziona cliente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Debitore *
                  </label>
                  <CustomSelect
                    options={debitoreOptions}
                    value={newForm.debitoreId}
                    onChange={(id) => updateNewForm('debitoreId', id)}
                    placeholder={!newForm.clienteId ? 'Prima seleziona cliente' : 'Seleziona debitore...'}
                    disabled={!newForm.clienteId}
                    loading={loadingDebitori}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Avvocati
                </label>
                <AvvocatiMultiSelect
                  avvocati={avvocati}
                  selectedIds={newForm.avvocatiIds || []}
                  onChange={(ids) => updateNewForm('avvocatiIds', ids)}
                  loading={loadingAvvocati}
                  placeholder="Seleziona avvocati..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Capitale
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={capitaleInput}
                      onChange={(e) => setCapitaleInput(e.target.value)}
                      onFocus={() =>
                        setCapitaleInput(newForm.capitale ? newForm.capitale.toString().replace('.', ',') : '')
                      }
                      onBlur={(e) => {
                        const n = formatoItalianoANumero(e.target.value);
                        updateNewForm('capitale', n);
                        setCapitaleInput(numeroAFormatoItaliano(n));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Data affidamento
                  </label>
                  <input
                    type="date"
                    value={newForm.dataAffidamento || ''}
                    onChange={(e) => updateNewForm('dataAffidamento', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note iniziali
                </label>
                <textarea
                  value={noteNuovaPratica}
                  onChange={(e) => setNoteNuovaPratica(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Note per la fase iniziale..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => {
                  resetNewForm();
                  setShowNewForm(false);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"
              >
                Annulla
              </button>
              <button
                onClick={handleCreatePratica}
                disabled={savingNew || !newForm.clienteId || !newForm.debitoreId}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/30"
              >
                <Plus className="h-4 w-4" />
                {savingNew ? 'Creazione...' : 'Crea pratica'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
