// apps/frontend/src/pages/DebitoriPage.tsx
import { User, Building2, Plus, Power, PowerOff, Trash2, Unlink, Eye, EyeOff } from 'lucide-react';
import { useDebitoriPage } from '../features/debitori/useDebitoriPage';
import { getDebitoreDisplayName } from '../api/debitori';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

export function DebitoriPage() {
  const {
    clienti,
    loadingClienti,
    selectedClienteId,
    selectedCliente,
    debitori,
    loadingDebitori,
    error,

    showInactive,
    setShowInactive,

    showNewForm,
    newForm,
    selectedDebitore,
    handleSelectCliente,
    handleSelectDebitore,
    setShowNewForm,
    updateNewForm,
    resetNewForm,
    submitNewDebitore,
    unlinkDebitore,
    deactivateDebitore,
    reactivateDebitore,
    deleteDebitore,
    isNewFormDirty,
    setError,
  } = useDebitoriPage();

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleFormField =
    (field: keyof typeof newForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateNewForm(field, e.target.value);
      if (error) setError(null);
    };

  // --- Gestori con conferma ---

  const handleCancelNewForm = async () => {
    if (isNewFormDirty()) {
      const conferma = await confirm({
        title: 'Annullare la creazione?',
        message: (
          <>
            Hai inserito dei dati nel form.
            <br />
            <span className="text-slate-500 dark:text-slate-400">
              Se annulli, le informazioni inserite andranno perse.
            </span>
          </>
        ),
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

    // Validazione
    if (newForm.tipoSoggetto === 'persona_fisica') {
      if (!newForm.nome.trim() || !newForm.cognome.trim()) {
        setError('Nome e cognome sono obbligatori per persona fisica.');
        return;
      }
    } else {
      if (!newForm.ragioneSociale.trim()) {
        setError('La ragione sociale è obbligatoria per persona giuridica.');
        return;
      }
    }

    const displayName =
      newForm.tipoSoggetto === 'persona_fisica'
        ? `${newForm.nome.trim()} ${newForm.cognome.trim()}`
        : newForm.ragioneSociale.trim();

    const conferma = await confirm({
      title: 'Creare il debitore?',
      message: (
        <>
          Stai per creare il debitore <strong>{displayName}</strong> e collegarlo
          al cliente <strong>{selectedCliente?.ragioneSociale}</strong>.
        </>
      ),
      confirmText: 'Crea debitore',
      cancelText: 'Annulla',
      variant: 'default',
    });
    if (!conferma) return;

    submitNewDebitore(e);
  };

  const handleUnlink = async (d: typeof debitori[0]) => {
    const conferma = await confirm({
      title: 'Scollegare il debitore?',
      message: (
        <>
          Stai per scollegare <strong>{getDebitoreDisplayName(d)}</strong> dal
          cliente <strong>{selectedCliente?.ragioneSociale}</strong>.
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            Il debitore non verrà eliminato, solo rimosso dalla lista di questo cliente.
          </span>
        </>
      ),
      confirmText: 'Scollega',
      cancelText: 'Annulla',
      variant: 'warning',
    });
    if (!conferma) return;

    unlinkDebitore(d);
  };

  const handleDeactivate = async (d: typeof debitori[0]) => {
    const conferma = await confirm({
      title: 'Disattivare il debitore?',
      message: (
        <>
          Stai per disattivare <strong>{getDebitoreDisplayName(d)}</strong>.
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            Il debitore non sarà più visibile nelle liste ma potrà essere riattivato.
          </span>
        </>
      ),
      confirmText: 'Disattiva',
      cancelText: 'Annulla',
      variant: 'warning',
    });
    if (!conferma) return;

    deactivateDebitore(d);
  };

  const handleReactivate = async (d: typeof debitori[0]) => {
    const conferma = await confirm({
      title: 'Riattivare il debitore?',
      message: (
        <>
          Stai per riattivare <strong>{getDebitoreDisplayName(d)}</strong>.
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            Il debitore tornerà visibile nelle liste.
          </span>
        </>
      ),
      confirmText: 'Riattiva',
      cancelText: 'Annulla',
      variant: 'info',
    });
    if (!conferma) return;

    reactivateDebitore(d);
  };

  const handleDelete = async (d: typeof debitori[0]) => {
    const conferma = await confirm({
      title: 'Eliminare definitivamente?',
      message: (
        <>
          Stai per eliminare <strong>{getDebitoreDisplayName(d)}</strong>.
          <br />
          <span className="text-rose-600 dark:text-rose-400">
            Questa azione è irreversibile.
          </span>
        </>
      ),
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      variant: 'danger',
    });
    if (!conferma) return;

    deleteDebitore(d);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Anagrafiche
          </p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Debitori per cliente
          </h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Cerca un cliente per visualizzare e gestire i debitori ad esso
            collegati.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 text-xs md:items-end">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Cliente selezionato
          </span>
          <SearchableClienteSelect
            clienti={clienti}
            selectedClienteId={selectedClienteId}
            onSelect={handleSelectCliente}
            loading={loadingClienti}
            placeholder="Cerca cliente..."
            className="w-full min-w-[280px] md:w-80"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-600/80 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">
          {error}
        </div>
      )}

      {/* SE NESSUN CLIENTE SELEZIONATO */}
      {!selectedClienteId && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Cerca e seleziona un cliente per vedere l&apos;elenco dei debitori
          collegati e poter inserire un nuovo debitore.
        </div>
      )}

      {/* CONTENUTO PER CLIENTE SELEZIONATO */}
      {selectedClienteId && (
        <div className="space-y-4">
          {/* BARRA CONTESTUALE CLIENTE */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-black/40 md:flex-row md:items-center">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cliente
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {selectedCliente?.ragioneSociale ?? '(Sconosciuto)'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedCliente?.partitaIva && (
                  <span className="mr-2">P.IVA {selectedCliente.partitaIva}</span>
                )}
                {(selectedCliente?.citta || selectedCliente?.nazione) && (
                  <span>
                    ·{' '}
                    {[
                      selectedCliente?.citta,
                      selectedCliente?.provincia,
                      selectedCliente?.nazione,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!selectedClienteId}
                onClick={() => setShowNewForm(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus className="h-3 w-3" />
                Nuovo debitore
              </button>
            </div>
          </div>

          {/* FORM NUOVO DEBITORE */}
          {showNewForm && (
            <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Nuovo debitore per questo cliente
                </h3>
                <button
                  type="button"
                  onClick={handleCancelNewForm}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Annulla
                </button>
              </div>

              <form onSubmit={handleSubmitNewDebitore} className="space-y-3">
                {/* TIPO SOGGETTO */}
                <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Tipo soggetto
                    </label>
                    <select
                      value={newForm.tipoSoggetto}
                      onChange={handleFormField('tipoSoggetto')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                    >
                      <option value="persona_fisica">Persona fisica</option>
                      <option value="persona_giuridica">Persona giuridica</option>
                    </select>
                  </div>

                  {newForm.tipoSoggetto === 'persona_fisica' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={newForm.nome}
                          onChange={handleFormField('nome')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          Cognome *
                        </label>
                        <input
                          type="text"
                          value={newForm.cognome}
                          onChange={handleFormField('cognome')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                        Ragione sociale *
                      </label>
                      <input
                        type="text"
                        value={newForm.ragioneSociale}
                        onChange={handleFormField('ragioneSociale')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>

                {/* DOCUMENTI IDENTIFICATIVI */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Codice fiscale
                    </label>
                    <input
                      type="text"
                      value={newForm.codiceFiscale}
                      onChange={handleFormField('codiceFiscale')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={newForm.partitaIva}
                      onChange={handleFormField('partitaIva')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* CONTATTI */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Telefono
                    </label>
                    <input
                      type="text"
                      value={newForm.telefono}
                      onChange={handleFormField('telefono')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newForm.email}
                      onChange={handleFormField('email')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelNewForm}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    Salva debitore
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* LISTA DEBITORI DEL CLIENTE */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Debitori collegati al cliente
              </h3>

              {/* Toggle mostra disattivati */}
              <button
                type="button"
                onClick={() => setShowInactive(!showInactive)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  showInactive
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {showInactive ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Nascondi disattivati</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">Mostra disattivati</span>
                  </>
                )}
              </button>
            </div>

            {loadingDebitori ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Caricamento debitori...
              </p>
            ) : debitori.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showInactive
                  ? 'Nessun debitore collegato a questo cliente (inclusi disattivati).'
                  : 'Nessun debitore attivo collegato a questo cliente. Usa il pulsante "Nuovo debitore" per inserirne uno.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="px-3 py-2">Debitore</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Contatti</th>
                      <th className="px-3 py-2">Stato</th>
                      <th className="px-3 py-2 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {debitori.map((d) => {
                      const isSelected = selectedDebitore?.id === d.id;
                      const isInactive = d.attivo === false;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => handleSelectDebitore(d)}
                          className={`cursor-pointer transition ${
                            isInactive ? 'opacity-60' : ''
                          } ${
                            isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-900/30'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-2">
                              {d.tipoSoggetto === 'persona_fisica' ? (
                                <User
                                  className={`h-3 w-3 ${isInactive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}
                                />
                              ) : (
                                <Building2
                                  className={`h-3 w-3 ${isInactive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}
                                />
                              )}
                              <span>{getDebitoreDisplayName(d)}</span>
                              {isInactive && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-medium uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                  Disattivato
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {d.tipoSoggetto === 'persona_fisica'
                              ? 'Persona fisica'
                              : 'Persona giuridica'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            <div>{d.email || '-'}</div>
                            <div className="text-[11px] text-slate-400">
                              {d.telefono || ''}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isInactive
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                              }`}
                            >
                              {isInactive ? 'Disattivo' : 'Attivo'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              {isInactive ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactivate(d);
                                    }}
                                    title="Riattiva"
                                    className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                                  >
                                    <Power className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(d);
                                    }}
                                    title="Elimina definitivamente"
                                    className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnlink(d);
                                    }}
                                    title="Scollega dal cliente"
                                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                  >
                                    <Unlink className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeactivate(d);
                                    }}
                                    title="Disattiva"
                                    className="rounded p-1 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30"
                                  >
                                    <PowerOff className="h-3.5 w-3.5" />
                                  </button>
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

          {/* DETTAGLIO DEBITORE SELEZIONATO */}
          {selectedDebitore && (
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/40">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Dettaglio debitore selezionato
                </h4>
                {selectedDebitore.attivo === false && (
                  <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-medium uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    Disattivato
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Identità
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {getDebitoreDisplayName(selectedDebitore)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedDebitore.tipoSoggetto === 'persona_fisica'
                      ? 'Persona fisica'
                      : 'Persona giuridica'}
                  </p>
                  {selectedDebitore.codiceFiscale && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      CF: {selectedDebitore.codiceFiscale}
                    </p>
                  )}
                  {selectedDebitore.partitaIva && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      P.IVA: {selectedDebitore.partitaIva}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Contatti
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    Email: {selectedDebitore.email || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    Telefono: {selectedDebitore.telefono || '-'}
                  </p>
                  {selectedDebitore.referente && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
                      Referente: {selectedDebitore.referente}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Indirizzo
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    {selectedDebitore.indirizzo || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    {[selectedDebitore.cap, selectedDebitore.citta]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    {[selectedDebitore.provincia, selectedDebitore.nazione]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Dialog di conferma */}
      <ConfirmDialog />
    </div>
  );
}