// apps/frontend/src/pages/DebitoriPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Building2,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Edit,
  RefreshCw,
} from 'lucide-react';
import { useDebitoriPage } from '../features/debitori/useDebitoriPage';
import { getDebitoreDisplayName } from '../api/debitori';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/Pagination';

export function DebitoriPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [initialParams] = useState(() => {
    const locationState = location.state as { clienteId?: string; debitoreId?: string } | null;
    if (locationState?.clienteId || locationState?.debitoreId) {
      return {
        clienteId: locationState.clienteId || null,
        debitoreId: locationState.debitoreId || null,
      };
    }

    return {
      clienteId: searchParams.get('clienteId'),
      debitoreId: searchParams.get('debitoreId'),
    };
  });

  const [urlCleaned, setUrlCleaned] = useState(false);
  useEffect(() => {
    if ((initialParams.clienteId || initialParams.debitoreId) && !urlCleaned) {
      setUrlCleaned(true);
      navigate('/debitori', { replace: true, state: null });
    }
  }, [initialParams.clienteId, initialParams.debitoreId, urlCleaned, navigate]);

  const {
    clienti,
    loadingClienti,
    selectedClienteId,
    selectedCliente,
    debitori,
    loadingDebitori,
    showInactive,
    setShowInactive,
    selectedDebitore,
    detailForm,
    savingDetail,
    newForm,
    error,
    handleSelectCliente,
    handleSelectDebitore,
    handleCloseDetail,
    handleCancelEditing: cancelEditing,
    updateDetailForm,
    isDetailFormDirty,
    submitDetailForm,
    updateNewForm,
    resetNewForm,
    isNewFormDirty,
    submitNewDebitore,
    deactivateDebitore,
    reactivateDebitore,
    deleteDebitore,
  } = useDebitoriPage({
    initialClienteId: initialParams.clienteId,
    initialDebitoreId: initialParams.debitoreId,
  });

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleNewFormField =
    (field: keyof typeof newForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateNewForm(field, e.target.value as any);
    };

  const handleDetailFormField =
    (field: keyof typeof detailForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateDetailForm(field, e.target.value as any);
    };

  const handleCancelNewForm = async () => {
    if (isNewFormDirty()) {
      const conferma = await confirm({
        title: 'Annullare la creazione?',
        message: 'Hai inserito dei dati nel form. Se annulli, le informazioni inserite andranno perse.',
        confirmText: 'Sì, annulla',
        cancelText: 'Continua',
        variant: 'warning',
      });
      if (!conferma) return;
    }
    resetNewForm();
    setShowNewModal(false);
  };

  const handleSubmitNewDebitore = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = newForm.tipoSoggetto === 'persona_fisica'
      ? `${newForm.nome.trim()} ${newForm.cognome.trim()}`
      : newForm.ragioneSociale.trim();
    const conferma = await confirm({
      title: 'Creare il debitore?',
      message: `Stai per creare il debitore ${displayName} e collegarlo al cliente ${selectedCliente?.ragioneSociale}.`,
      confirmText: 'Crea debitore',
      cancelText: 'Annulla',
      variant: 'info',
    });
    if (!conferma) return;
    await submitNewDebitore();
    setShowNewModal(false);
  };

  const handleRowClick = (debitore: any) => {
    handleSelectDebitore(debitore);
    setShowViewModal(true);
    setShowEditModal(false);
  };

  const handleStartEditingFromView = () => {
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleCancelEditingToView = () => {
    cancelEditing();
    setShowEditModal(false);
    setShowViewModal(true);
  };

  const handleCloseView = () => {
    handleCloseDetail();
    setShowViewModal(false);
  };

  const handleCancelEditing = async () => {
    if (isDetailFormDirty()) {
      const conferma = await confirm({
        title: 'Annullare le modifiche?',
        message: 'Hai modificato i dati del debitore. Se annulli, le modifiche non salvate andranno perse.',
        confirmText: 'Sì, annulla modifiche',
        cancelText: 'Continua a modificare',
        variant: 'warning',
      });
      if (!conferma) return;
    }
    cancelEditing();
    setShowEditModal(false);
  };

  const handleSubmitDetailForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = getDebitoreDisplayName(selectedDebitore!);
    const conferma = await confirm({
      title: 'Salvare le modifiche?',
      message: `Stai per salvare le modifiche al debitore ${displayName}.`,
      confirmText: 'Salva modifiche',
      cancelText: 'Annulla',
      variant: 'info',
    });
    if (!conferma) return;
    await submitDetailForm();
    setShowEditModal(false);
    setShowViewModal(true);
  };

  const handleDeactivate = async (debitore: any) => {
    const displayName = getDebitoreDisplayName(debitore);
    if (await confirm({
      title: 'Disattiva debitore',
      message: `Disattivare ${displayName}?`,
      confirmText: 'Disattiva',
      variant: 'warning',
    })) {
      try {
        await deactivateDebitore(debitore.id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleReactivate = async (debitore: any) => {
    try {
      await reactivateDebitore(debitore.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (debitore: any) => {
    const displayName = getDebitoreDisplayName(debitore);
    if (await confirm({
      title: 'Elimina debitore',
      message: `Eliminare definitivamente ${displayName}?\nQuesta operazione è irreversibile.`,
      confirmText: 'Elimina',
      variant: 'danger',
    })) {
      try {
        await deleteDebitore(debitore.id);
      } catch (err: any) {
        alert(err.message || 'Impossibile eliminare');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Anagrafiche</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Debitori</h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Seleziona un cliente per visualizzare e gestire i debitori collegati.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* SEZIONE SELEZIONE CLIENTE */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Seleziona cliente</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full min-w-[280px] md:w-80">
            <SearchableClienteSelect
              clienti={clienti}
              selectedClienteId={selectedClienteId}
              onSelect={handleSelectCliente}
              loading={loadingClienti}
              placeholder="Cerca cliente..."
            />
          </div>
          {selectedCliente && (
            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{selectedCliente.ragioneSociale}</p>
                  {selectedCliente.partitaIva && <p className="text-slate-500 dark:text-slate-400">P.IVA: {selectedCliente.partitaIva}</p>}
                  {selectedCliente.citta && <p className="text-slate-500 dark:text-slate-400">{selectedCliente.citta}{selectedCliente.provincia && ` (${selectedCliente.provincia})`}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEZIONE DEBITORI */}
      {selectedClienteId ? (
        <>
          {/* FILTRI E AZIONI */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                {showInactive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Mostra disattivati
              </span>
            </label>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nuovo Debitore
            </button>
          </div>

          {/* LISTA DEBITORI */}
          <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
            {loadingDebitori ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs">Caricamento...</span>
              </div>
            ) : !debitori || debitori.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <User className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nessun debitore collegato</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Debitore</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Contatti</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {debitori
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((debitore) => (
                      <tr
                        key={debitore.id}
                        onClick={() => handleRowClick(debitore)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${!debitore.attivo ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {debitore.tipoSoggetto === 'persona_fisica' ? (
                              <User className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Building2 className="h-4 w-4 text-slate-400" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {getDebitoreDisplayName(debitore)}
                              </p>
                              {debitore.codiceFiscale && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">CF: {debitore.codiceFiscale}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {debitore.tipoSoggetto === 'persona_fisica' ? 'Persona fisica' : 'Persona giuridica'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {debitore.email && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">{debitore.email}</p>
                            )}
                            {debitore.telefono && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">{debitore.telefono}</p>
                            )}
                            {!debitore.email && !debitore.telefono && (
                              <p className="text-xs text-slate-400">-</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {debitore.attivo ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivate(debitore);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Disattiva"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactivate(debitore);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Riattiva"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(debitore);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(debitori.length / ITEMS_PER_PAGE)}
                  totalItems={debitori.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Seleziona un cliente per visualizzare i debitori collegati</p>
        </div>
      )}

      {/* MODAL NUOVO DEBITORE */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelNewForm} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuovo Debitore</h2>
              <button onClick={handleCancelNewForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDebitore} className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo soggetto</label>
                <select
                  value={newForm.tipoSoggetto}
                  onChange={handleNewFormField('tipoSoggetto')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="persona_fisica">Persona fisica</option>
                  <option value="persona_giuridica">Persona giuridica</option>
                </select>
              </div>

              {newForm.tipoSoggetto === 'persona_fisica' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={newForm.nome}
                      onChange={handleNewFormField('nome')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cognome *</label>
                    <input
                      type="text"
                      value={newForm.cognome}
                      onChange={handleNewFormField('cognome')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data di nascita</label>
                    <input
                      type="date"
                      value={newForm.dataNascita}
                      onChange={handleNewFormField('dataNascita')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Luogo di nascita</label>
                    <input
                      type="text"
                      value={newForm.luogoNascita}
                      onChange={handleNewFormField('luogoNascita')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ragione sociale *</label>
                  <input
                    type="text"
                    value={newForm.ragioneSociale}
                    onChange={handleNewFormField('ragioneSociale')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Codice fiscale</label>
                  <input
                    type="text"
                    value={newForm.codiceFiscale}
                    onChange={handleNewFormField('codiceFiscale')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partita IVA</label>
                  <input
                    type="text"
                    value={newForm.partitaIva}
                    onChange={handleNewFormField('partitaIva')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={newForm.indirizzo}
                  onChange={handleNewFormField('indirizzo')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CAP</label>
                  <input
                    type="text"
                    value={newForm.cap}
                    onChange={handleNewFormField('cap')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Città</label>
                  <input
                    type="text"
                    value={newForm.citta}
                    onChange={handleNewFormField('citta')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={newForm.provincia}
                    onChange={handleNewFormField('provincia')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazione</label>
                <input
                  type="text"
                  value={newForm.nazione}
                  onChange={handleNewFormField('nazione')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={newForm.telefono}
                    onChange={handleNewFormField('telefono')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={handleNewFormField('email')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PEC</label>
                  <input
                    type="email"
                    value={newForm.pec}
                    onChange={handleNewFormField('pec')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referente</label>
                  <input
                    type="text"
                    value={newForm.referente}
                    onChange={handleNewFormField('referente')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCancelNewForm}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4" />
                  Crea Debitore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZZA DEBITORE */}
      {showViewModal && selectedDebitore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseView} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Dettaglio Debitore
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartEditingFromView}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  title="Modifica"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button onClick={handleCloseView} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo soggetto</label>
                <select
                  value={detailForm.tipoSoggetto}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="persona_fisica">Persona fisica</option>
                  <option value="persona_giuridica">Persona giuridica</option>
                </select>
              </div>

              {detailForm.tipoSoggetto === 'persona_fisica' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={detailForm.nome}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cognome *</label>
                    <input
                      type="text"
                      value={detailForm.cognome}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data di nascita</label>
                    <input
                      type="date"
                      value={detailForm.dataNascita}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Luogo di nascita</label>
                    <input
                      type="text"
                      value={detailForm.luogoNascita}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ragione sociale *</label>
                  <input
                    type="text"
                    value={detailForm.ragioneSociale}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Codice fiscale</label>
                  <input
                    type="text"
                    value={detailForm.codiceFiscale}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partita IVA</label>
                  <input
                    type="text"
                    value={detailForm.partitaIva}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={detailForm.indirizzo}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CAP</label>
                  <input
                    type="text"
                    value={detailForm.cap}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Città</label>
                  <input
                    type="text"
                    value={detailForm.citta}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={detailForm.provincia}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazione</label>
                <input
                  type="text"
                  value={detailForm.nazione}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={detailForm.telefono}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={detailForm.email}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PEC</label>
                  <input
                    type="email"
                    value={detailForm.pec}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referente</label>
                  <input
                    type="text"
                    value={detailForm.referente}
                    disabled
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseView}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICA DEBITORE */}
      {showEditModal && selectedDebitore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelEditing} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Modifica Debitore
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEditingToView}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button onClick={handleCancelEditing} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitDetailForm} className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo soggetto</label>
                <select
                  value={detailForm.tipoSoggetto}
                  onChange={handleDetailFormField('tipoSoggetto')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="persona_fisica">Persona fisica</option>
                  <option value="persona_giuridica">Persona giuridica</option>
                </select>
              </div>

              {detailForm.tipoSoggetto === 'persona_fisica' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={detailForm.nome}
                      onChange={handleDetailFormField('nome')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cognome *</label>
                    <input
                      type="text"
                      value={detailForm.cognome}
                      onChange={handleDetailFormField('cognome')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data di nascita</label>
                    <input
                      type="date"
                      value={detailForm.dataNascita}
                      onChange={handleDetailFormField('dataNascita')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Luogo di nascita</label>
                    <input
                      type="text"
                      value={detailForm.luogoNascita}
                      onChange={handleDetailFormField('luogoNascita')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ragione sociale *</label>
                  <input
                    type="text"
                    value={detailForm.ragioneSociale}
                    onChange={handleDetailFormField('ragioneSociale')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Codice fiscale</label>
                  <input
                    type="text"
                    value={detailForm.codiceFiscale}
                    onChange={handleDetailFormField('codiceFiscale')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partita IVA</label>
                  <input
                    type="text"
                    value={detailForm.partitaIva}
                    onChange={handleDetailFormField('partitaIva')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={detailForm.indirizzo}
                  onChange={handleDetailFormField('indirizzo')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CAP</label>
                  <input
                    type="text"
                    value={detailForm.cap}
                    onChange={handleDetailFormField('cap')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Città</label>
                  <input
                    type="text"
                    value={detailForm.citta}
                    onChange={handleDetailFormField('citta')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={detailForm.provincia}
                    onChange={handleDetailFormField('provincia')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazione</label>
                <input
                  type="text"
                  value={detailForm.nazione}
                  onChange={handleDetailFormField('nazione')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={detailForm.telefono}
                    onChange={handleDetailFormField('telefono')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={detailForm.email}
                    onChange={handleDetailFormField('email')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PEC</label>
                  <input
                    type="email"
                    value={detailForm.pec}
                    onChange={handleDetailFormField('pec')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referente</label>
                  <input
                    type="text"
                    value={detailForm.referente}
                    onChange={handleDetailFormField('referente')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingDetail}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingDetail ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
