// apps/frontend/src/pages/DebitoriPage.tsx
import { ChevronDown, User, Building2, Plus } from 'lucide-react';
import { useDebitoriPage } from '../features/debitori/useDebitoriPage';
import { getDebitoreDisplayName } from '../api/debitori';

export function DebitoriPage() {
  const {
    clienti,
    loadingClienti,
    selectedClienteId,
    selectedCliente,
    debitori,
    loadingDebitori,
    error,

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
    setError,
  } = useDebitoriPage();

  const handleClienteChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value || null;
    handleSelectCliente(value);
  };

  const handleFormField =
    (field: keyof typeof newForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateNewForm(field, e.target.value);
      if (error) setError(null);
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
            Seleziona un cliente per visualizzare e gestire i debitori ad esso
            collegati. Il form di creazione compare solo quando scegli di
            inserire un nuovo debitore.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 text-xs md:items-end">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Cliente selezionato
          </span>
          <div className="relative w-full min-w-[220px] md:w-64">
            <select
              disabled={loadingClienti}
              value={selectedClienteId ?? ''}
              onChange={handleClienteChange}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            >
              <option value="">
                {loadingClienti
                  ? 'Caricamento clienti...'
                  : 'Seleziona un cliente'}
              </option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ragioneSociale}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
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
          Seleziona un cliente per vedere l&apos;elenco dei debitori collegati e
          poter inserire un nuovo debitore.
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
                  <span className="mr-2">
                    P.IVA {selectedCliente.partitaIva}
                  </span>
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

          {/* FORM NUOVO DEBITORE (solo se showNewForm === true) */}
          {showNewForm && (
            <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Nuovo debitore per questo cliente
                </h3>
                <button
                  type="button"
                  onClick={resetNewForm}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Annulla
                </button>
              </div>

              <form onSubmit={submitNewDebitore} className="space-y-3">
                {/* TIPO SOGGETTO */}
                <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Tipo soggetto
                    </label>
                    <div className="relative">
                      <select
                        value={newForm.tipoSoggetto}
                        onChange={handleFormField('tipoSoggetto')}
                        className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      >
                        <option value="persona_fisica">
                          Persona fisica
                        </option>
                        <option value="persona_giuridica">
                          Persona giuridica
                        </option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {newForm.tipoSoggetto === 'persona_fisica' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={newForm.nome}
                          onChange={handleFormField('nome')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium">
                          Cognome *
                        </label>
                        <input
                          type="text"
                          value={newForm.cognome}
                          onChange={handleFormField('cognome')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">
                        Ragione sociale *
                      </label>
                      <input
                        type="text"
                        value={newForm.ragioneSociale}
                        onChange={handleFormField('ragioneSociale')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* DOCUMENTI IDENTIFICATIVI */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">
                      Codice fiscale
                    </label>
                    <input
                      type="text"
                      value={newForm.codiceFiscale}
                      onChange={handleFormField('codiceFiscale')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={newForm.partitaIva}
                      onChange={handleFormField('partitaIva')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* CONTATTI */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">
                      Telefono
                    </label>
                    <input
                      type="text"
                      value={newForm.telefono}
                      onChange={handleFormField('telefono')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newForm.email}
                      onChange={handleFormField('email')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetNewForm}
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
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
              Debitori collegati al cliente
            </h3>

            {loadingDebitori ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Caricamento debitori...
              </p>
            ) : debitori.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nessun debitore collegato a questo cliente. Usa il pulsante
                &quot;Nuovo debitore&quot; per inserirne uno.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="px-3 py-2">Debitore</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Contatti</th>
                      <th className="px-3 py-2 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {debitori.map((d) => {
                      const isSelected = selectedDebitore?.id === d.id;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => handleSelectDebitore(d)}
                          className={
                            'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60 ' +
                            (isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-900/30'
                              : '')
                          }
                        >
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-2">
                              {d.tipoSoggetto === 'persona_fisica' ? (
                                <User className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Building2 className="h-3 w-3 text-slate-400" />
                              )}
                              <span>{getDebitoreDisplayName(d)}</span>
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
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();   // <-- evita che selezioni/triggeri dettaglio
                                unlinkDebitore(d);
                              }}
                              className="text-[11px] font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              Scollega
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {selectedDebitore && (
          <section className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/40">
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
              Dettaglio debitore selezionato
            </h4>

            <div className="grid gap-3 md:grid-cols-2">
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
    </div>
  );
}
