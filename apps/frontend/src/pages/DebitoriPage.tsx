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
  Unlink,
  Eye,
  EyeOff,
  Pencil,
  X,
} from 'lucide-react';
import { useDebitoriPage } from '../features/debitori/useDebitoriPage';
import { getDebitoreDisplayName } from '../api/debitori';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

export function DebitoriPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Leggi parametri da URL query params O da location state (dalla modale)
  const [initialParams] = useState(() => {
    // Prima controlla location state (dalla modale DebitoreDetailModal)
    const locationState = location.state as { clienteId?: string; debitoreId?: string } | null;
    if (locationState?.clienteId || locationState?.debitoreId) {
      return {
        clienteId: locationState.clienteId || null,
        debitoreId: locationState.debitoreId || null,
        isOrfano: false,
      };
    }
    
    // Altrimenti usa query params (fallback)
    return {
      clienteId: searchParams.get('clienteId'),
      debitoreId: searchParams.get('debitoreId'),
      isOrfano: searchParams.get('orfano') === 'true',
    };
  });

  // Pulisci l'URL/state dopo aver salvato i parametri
  const [urlCleaned, setUrlCleaned] = useState(false);
  useEffect(() => {
    if ((initialParams.clienteId || initialParams.debitoreId) && !urlCleaned) {
      setUrlCleaned(true);
      // Pulisci l'URL e lo state mantenendo la pagina
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
    selectedDebitoreId,
    selectedDebitore,
    isEditing,
    detailForm,
    savingDetail,
    showNewForm,
    newForm,
    error,
    handleSelectCliente,
    handleSelectDebitore,
    handleCloseDetail,
    handleStartEditing,
    handleCancelEditing: cancelEditing,
    updateDetailForm,
    isDetailFormDirty,
    submitDetailForm,
    setShowNewForm,
    updateNewForm,
    resetNewForm,
    isNewFormDirty,
    submitNewDebitore,
    unlinkDebitore,
    deactivateDebitore,
    reactivateDebitore,
    deleteDebitore,
  } = useDebitoriPage({
    initialClienteId: initialParams.clienteId,
    initialDebitoreId: initialParams.debitoreId,
  });

  const { confirm, ConfirmDialog } = useConfirmDialog();

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
        message: (<>Hai inserito dei dati nel form.<br /><span className="text-slate-500 dark:text-slate-400">Se annulli, le informazioni inserite andranno perse.</span></>),
        confirmText: 'Sì, annulla',
        cancelText: 'Continua',
        variant: 'warning',
      });
      if (!conferma) return;
    }
    resetNewForm();
  };

  const handleSubmitNewDebitore = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = newForm.tipoSoggetto === 'persona_fisica'
      ? `${newForm.nome.trim()} ${newForm.cognome.trim()}`
      : newForm.ragioneSociale.trim();
    const conferma = await confirm({
      title: 'Creare il debitore?',
      message: (<>Stai per creare il debitore <strong>{displayName}</strong> e collegarlo al cliente <strong>{selectedCliente?.ragioneSociale}</strong>.</>),
      confirmText: 'Crea debitore',
      cancelText: 'Annulla',
      variant: 'default',
    });
    if (!conferma) return;
    await submitNewDebitore();
  };

  const handleCancelEditing = async () => {
    if (isDetailFormDirty()) {
      const conferma = await confirm({
        title: 'Annullare le modifiche?',
        message: (<>Hai modificato i dati del debitore.<br /><span className="text-slate-500 dark:text-slate-400">Se annulli, le modifiche non salvate andranno perse.</span></>),
        confirmText: 'Sì, annulla modifiche',
        cancelText: 'Continua a modificare',
        variant: 'warning',
      });
      if (!conferma) return;
    }
    cancelEditing();
  };

  const handleSubmitDetailForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = getDebitoreDisplayName(selectedDebitore!);
    const conferma = await confirm({
      title: 'Salvare le modifiche?',
      message: (<>Stai per salvare le modifiche al debitore <strong>{displayName}</strong>.</>),
      confirmText: 'Salva modifiche',
      cancelText: 'Annulla',
      variant: 'default',
    });
    if (!conferma) return;
    await submitDetailForm();
  };

  const handleUnlink = async (debitoreId: string, debitoreNome: string) => {
    const conferma = await confirm({
      title: 'Scollegare il debitore?',
      message: (<>Stai per scollegare <strong>{debitoreNome}</strong> dal cliente <strong>{selectedCliente?.ragioneSociale}</strong>.<br /><span className="text-slate-500 dark:text-slate-400">Il debitore non verrà eliminato, ma non sarà più associato a questo cliente.</span></>),
      confirmText: 'Scollega',
      cancelText: 'Annulla',
      variant: 'warning',
    });
    if (!conferma) return;
    await unlinkDebitore(debitoreId);
  };

  const handleDeactivate = async (debitoreId: string, debitoreNome: string) => {
    const conferma = await confirm({
      title: 'Disattivare il debitore?',
      message: (<>Stai per disattivare <strong>{debitoreNome}</strong>.<br /><span className="text-slate-500 dark:text-slate-400">Il debitore non sarà più visibile ma potrà essere riattivato.</span></>),
      confirmText: 'Disattiva',
      cancelText: 'Annulla',
      variant: 'warning',
    });
    if (!conferma) return;
    await deactivateDebitore(debitoreId);
  };

  const handleReactivate = async (debitoreId: string, debitoreNome: string) => {
    const conferma = await confirm({
      title: 'Riattivare il debitore?',
      message: (<>Stai per riattivare <strong>{debitoreNome}</strong>.</>),
      confirmText: 'Riattiva',
      cancelText: 'Annulla',
      variant: 'info',
    });
    if (!conferma) return;
    await reactivateDebitore(debitoreId);
  };

  const handleDelete = async (debitoreId: string, debitoreNome: string) => {
    const conferma = await confirm({
      title: 'Eliminare definitivamente?',
      message: (<>Stai per eliminare <strong>{debitoreNome}</strong>.<br /><span className="text-rose-600 dark:text-rose-400">Questa azione è irreversibile.</span></>),
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      variant: 'danger',
    });
    if (!conferma) return;
    await deleteDebitore(debitoreId);
  };

  const handleCloseDetailWithConfirm = async () => {
    if (isEditing && isDetailFormDirty()) {
      const conferma = await confirm({
        title: 'Chiudere senza salvare?',
        message: (<>Hai modificato i dati del debitore.<br /><span className="text-slate-500 dark:text-slate-400">Se chiudi, le modifiche non salvate andranno perse.</span></>),
        confirmText: 'Sì, chiudi',
        cancelText: 'Continua a modificare',
        variant: 'warning',
      });
      if (!conferma) return;
    }
    handleCloseDetail();
  };

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 read-only:cursor-default read-only:bg-slate-50 read-only:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:read-only:bg-slate-800/50 dark:read-only:text-slate-300";
  const labelClass = "mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Anagrafiche</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Debitori per Cliente</h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">Seleziona un cliente per visualizzare, creare o modificare i debitori ad esso collegati.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-600/80 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">{error}</div>
      )}

      {/* SEZIONE SELEZIONE CLIENTE */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Seleziona cliente</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full min-w-[280px] md:w-80">
            <SearchableClienteSelect clienti={clienti} selectedClienteId={selectedClienteId} onSelect={handleSelectCliente} loading={loadingClienti} placeholder="Cerca cliente..." />
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
      {selectedClienteId && (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* FORM DETTAGLIO DEBITORE (SINISTRA) */}
          <section className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40 md:sticky md:top-4 ${selectedDebitoreId ? 'max-h-[2000px] p-4 opacity-100 md:w-[420px] md:min-w-[340px]' : 'max-h-0 border-0 p-0 opacity-0 md:w-0 md:min-w-0'}`} style={{ willChange: 'max-height, width, opacity, padding' }}>
            {selectedDebitoreId && selectedDebitore && (
              <>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{getDebitoreDisplayName(selectedDebitore)}</h3>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button type="button" onClick={handleStartEditing} className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/60">
                        <Pencil className="h-3 w-3" />Modifica
                      </button>
                    )}
                    <button type="button" onClick={handleCloseDetailWithConfirm} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {selectedDebitore.attivo === false && (
                  <div className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">⚠️ Questo debitore è disattivato</div>
                )}
                <form onSubmit={handleSubmitDetailForm} className="space-y-4">
                  <div>
                    <label className={labelClass}>Tipo soggetto</label>
                    <select value={detailForm.tipoSoggetto} onChange={handleDetailFormField('tipoSoggetto')} disabled={!isEditing} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500">
                      <option value="persona_fisica">Persona fisica</option>
                      <option value="persona_giuridica">Persona giuridica</option>
                    </select>
                  </div>
                  {detailForm.tipoSoggetto === 'persona_fisica' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Nome *</label><input type="text" value={detailForm.nome} onChange={handleDetailFormField('nome')} readOnly={!isEditing} className={inputClass} /></div>
                        <div><label className={labelClass}>Cognome *</label><input type="text" value={detailForm.cognome} onChange={handleDetailFormField('cognome')} readOnly={!isEditing} className={inputClass} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Data di nascita</label><input type="date" value={detailForm.dataNascita} onChange={handleDetailFormField('dataNascita')} readOnly={!isEditing} className={inputClass} /></div>
                        <div><label className={labelClass}>Luogo di nascita</label><input type="text" value={detailForm.luogoNascita} onChange={handleDetailFormField('luogoNascita')} readOnly={!isEditing} className={inputClass} /></div>
                      </div>
                    </>
                  )}
                  {detailForm.tipoSoggetto === 'persona_giuridica' && (
                    <div><label className={labelClass}>Ragione sociale *</label><input type="text" value={detailForm.ragioneSociale} onChange={handleDetailFormField('ragioneSociale')} readOnly={!isEditing} className={inputClass} /></div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Codice fiscale</label><input type="text" value={detailForm.codiceFiscale} onChange={handleDetailFormField('codiceFiscale')} readOnly={!isEditing} className={inputClass} /></div>
                    <div><label className={labelClass}>Partita IVA</label><input type="text" value={detailForm.partitaIva} onChange={handleDetailFormField('partitaIva')} readOnly={!isEditing} className={inputClass} /></div>
                  </div>
                  <div><label className={labelClass}>Indirizzo</label><input type="text" value={detailForm.indirizzo} onChange={handleDetailFormField('indirizzo')} readOnly={!isEditing} className={inputClass} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelClass}>CAP</label><input type="text" value={detailForm.cap} onChange={handleDetailFormField('cap')} readOnly={!isEditing} className={inputClass} /></div>
                    <div><label className={labelClass}>Città</label><input type="text" value={detailForm.citta} onChange={handleDetailFormField('citta')} readOnly={!isEditing} className={inputClass} /></div>
                    <div><label className={labelClass}>Provincia</label><input type="text" value={detailForm.provincia} onChange={handleDetailFormField('provincia')} readOnly={!isEditing} maxLength={2} className={inputClass} /></div>
                  </div>
                  <div><label className={labelClass}>Nazione</label><input type="text" value={detailForm.nazione} onChange={handleDetailFormField('nazione')} readOnly={!isEditing} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Telefono</label><input type="text" value={detailForm.telefono} onChange={handleDetailFormField('telefono')} readOnly={!isEditing} className={inputClass} /></div>
                    <div><label className={labelClass}>Referente</label><input type="text" value={detailForm.referente} onChange={handleDetailFormField('referente')} readOnly={!isEditing} className={inputClass} /></div>
                  </div>
                  <div><label className={labelClass}>Email</label><input type="email" value={detailForm.email} onChange={handleDetailFormField('email')} readOnly={!isEditing} className={inputClass} /></div>
                  <div><label className={labelClass}>PEC</label><input type="email" value={detailForm.pec} onChange={handleDetailFormField('pec')} readOnly={!isEditing} className={inputClass} /></div>
                  {isEditing && (
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={handleCancelEditing} disabled={savingDetail} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annulla</button>
                      <button type="submit" disabled={savingDetail} className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400">{savingDetail ? 'Salvataggio...' : 'Salva modifiche'}</button>
                    </div>
                  )}
                </form>
              </>
            )}
          </section>

          {/* LISTA DEBITORI + FORM NUOVO (DESTRA) */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* FORM NUOVO DEBITORE */}
            {showNewForm && (
              <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Nuovo debitore</h3>
                <form onSubmit={handleSubmitNewDebitore} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Tipo soggetto</label>
                    <select value={newForm.tipoSoggetto} onChange={handleNewFormField('tipoSoggetto')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="persona_fisica">Persona fisica</option>
                      <option value="persona_giuridica">Persona giuridica</option>
                    </select>
                  </div>
                  {newForm.tipoSoggetto === 'persona_fisica' && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Nome *</label><input type="text" value={newForm.nome} onChange={handleNewFormField('nome')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                      <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Cognome *</label><input type="text" value={newForm.cognome} onChange={handleNewFormField('cognome')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                    </div>
                  )}
                  {newForm.tipoSoggetto === 'persona_giuridica' && (
                    <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Ragione sociale *</label><input type="text" value={newForm.ragioneSociale} onChange={handleNewFormField('ragioneSociale')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Codice fiscale</label><input type="text" value={newForm.codiceFiscale} onChange={handleNewFormField('codiceFiscale')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                    <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Partita IVA</label><input type="text" value={newForm.partitaIva} onChange={handleNewFormField('partitaIva')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Telefono</label><input type="text" value={newForm.telefono} onChange={handleNewFormField('telefono')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                    <div><label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Email</label><input type="email" value={newForm.email} onChange={handleNewFormField('email')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={handleCancelNewForm} className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800">Annulla</button>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:bg-indigo-500 dark:hover:bg-indigo-400">Crea debitore</button>
                  </div>
                </form>
              </section>
            )}

            {/* LISTA DEBITORI */}
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Debitori collegati al cliente</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowInactive(!showInactive)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${showInactive ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                    {showInactive ? <><EyeOff className="h-3 w-3" /><span className="hidden sm:inline">Nascondi disattivati</span></> : <><Eye className="h-3 w-3" /><span className="hidden sm:inline">Mostra disattivati</span></>}
                  </button>
                  {!showNewForm && (
                    <button type="button" onClick={() => { setShowNewForm(true); handleCloseDetail(); }} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                      <Plus className="h-3 w-3" /><span className="hidden sm:inline">Nuovo</span>
                    </button>
                  )}
                </div>
              </div>
              {loadingDebitori ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Caricamento debitori...</p>
              ) : debitori.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{showInactive ? 'Nessun debitore collegato a questo cliente (inclusi disattivati).' : 'Nessun debitore attivo collegato a questo cliente. Usa il pulsante "Nuovo" per inserirne uno.'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="px-3 py-2">Debitore</th>
                        <th className="px-3 py-2 hidden sm:table-cell">Tipo</th>
                        <th className="px-3 py-2 hidden md:table-cell">Contatti</th>
                        <th className="px-3 py-2">Stato</th>
                        <th className="px-3 py-2 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {debitori.map((d) => {
                        const isSelected = selectedDebitoreId === d.id;
                        const isInactive = !Boolean(d.attivo);
                        const displayName = getDebitoreDisplayName(d);
                        return (
                          <tr key={d.id} onClick={() => { setShowNewForm(false); handleSelectDebitore(d); }} className={`cursor-pointer transition ${isInactive ? 'opacity-60' : ''} ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-900/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'}`}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                {d.tipoSoggetto === 'persona_fisica' ? <User className={`h-3.5 w-3.5 ${isInactive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`} /> : <Building2 className={`h-3.5 w-3.5 ${isInactive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`} />}
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-slate-50">{displayName}</p>
                                  {d.codiceFiscale && <p className="text-[10px] text-slate-500 dark:text-slate-400">CF: {d.codiceFiscale}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{d.tipoSoggetto === 'persona_fisica' ? 'Persona fisica' : 'Persona giuridica'}</td>
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 hidden md:table-cell">{d.email || d.telefono || '-'}</td>
                            <td className="px-3 py-2.5">
                              {isInactive ? <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-medium uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-400">Disattivo</span> : <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Attivo</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                {isInactive ? (
                                  <>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleReactivate(d.id, displayName); }} title="Riattiva" className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"><Power className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(d.id, displayName); }} title="Elimina definitivamente" className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleUnlink(d.id, displayName); }} title="Scollega dal cliente" className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"><Unlink className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeactivate(d.id, displayName); }} title="Disattiva" className="rounded p-1 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30"><PowerOff className="h-3.5 w-3.5" /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {!selectedClienteId && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Seleziona un cliente per visualizzare i debitori collegati</p>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}