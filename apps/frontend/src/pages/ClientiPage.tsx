// apps/frontend/src/pages/ClientiPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

import { useClientiPage } from '../features/clienti/useClientiPage';
import {
  CLIENTE_FIELD_CONFIG,
  NAZIONI_OPTIONS,
  TIPOLOGIA_OPTIONS,
} from '../features/clienti/constants';

export function ClientiPage() {
  const {
    clienti,
    loading,
    error,
    form,
    isEditing,
    totalClienti,
    setError,
    handleChange,
    handleSubmit,
    handleSelectCliente,
    handleDeleteCliente,
    resetForm,
    editingId,
  } = useClientiPage();

  const params = useParams<{ id?: string }>();

  useEffect(() => {
    if (!params.id || !clienti.length) return;

    const cliente = clienti.find((c) => c.id === params.id);
    if (cliente) {
      handleSelectCliente(cliente);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, clienti]);

  const tipologiaLabelMap = Object.fromEntries(
    TIPOLOGIA_OPTIONS.filter((t) => t.value !== '').map((t) => [
      t.value,
      t.label,
    ]),
  );

  return (
    <div className="space-y-6">
      {/* HEADER SEZIONE */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Anagrafiche
          </p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Clienti dello studio
          </h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Gestisci le anagrafiche dei soggetti creditori collegati alle
            pratiche di recupero. I dati inseriti qui saranno richiamabili da
            tutte le altre sezioni del gestionale.
          </p>
        </div>

        <div className="flex items-end gap-3">
          {/* BOX NUMERO CLIENTI */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-xs shadow-sm shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/30">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Totale clienti
            </span>
            <span className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {totalClienti.toString().padStart(2, '0')}
            </span>
          </div>

          {/* PULSANTE "NUOVO CLIENTE" */}
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            + Nuovo cliente
          </button>
        </div>
      </div>

      {/* ERRORI */}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">
          {error}
        </div>
      )}

      {/* FORM + LISTA */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        {/* FORM CLIENTE */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-black/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {isEditing ? 'Modifica cliente' : 'Nuovo cliente'}
            </h3>
            {isEditing && (
              <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
                Modifica in corso
              </span>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-3 text-xs text-slate-900 dark:text-slate-50"
          >
            {/* RAGIONE SOCIALE */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {CLIENTE_FIELD_CONFIG.ragioneSociale.label}
              </label>
              <input
                type="text"
                name="ragioneSociale"
                value={form.ragioneSociale}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                placeholder={CLIENTE_FIELD_CONFIG.ragioneSociale.placeholder}
              />
            </div>

            {/* TIPOLOGIA + REFERENTE */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Tipologia
                </label>
                <div className="relative mt-1">
                  <select
                    name="tipologia"
                    value={form.tipologia}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white/95 px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm shadow-slate-200/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40"
                  >
                    {TIPOLOGIA_OPTIONS.map((opt) => (
                      <option key={opt.value || 'empty'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute inset-y-0 right-2 my-auto h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.referente.label}
                </label>
                <input
                  type="text"
                  name="referente"
                  value={form.referente}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.referente.placeholder}
                />
              </div>
            </div>

            {/* P.IVA + TELEFONO */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.partitaIva.label}
                </label>
                <input
                  type="text"
                  name="partitaIva"
                  value={form.partitaIva}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.partitaIva.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.telefono.label}
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.telefono.placeholder}
                />
              </div>
            </div>

            {/* SEDE LEGALE + SEDE OPERATIVA */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.sedeLegale.label}
                </label>
                <input
                  type="text"
                  name="sedeLegale"
                  value={form.sedeLegale}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.sedeLegale.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.sedeOperativa.label}
                </label>
                <input
                  type="text"
                  name="sedeOperativa"
                  value={form.sedeOperativa}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.sedeOperativa.placeholder}
                />
              </div>
            </div>

            {/* INDIRIZZO + CAP */}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.indirizzo.label}
                </label>
                <input
                  type="text"
                  name="indirizzo"
                  value={form.indirizzo}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.indirizzo.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.cap.label}
                </label>
                <input
                  type="text"
                  name="cap"
                  value={form.cap}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.cap.placeholder}
                />
              </div>
            </div>

            {/* CITTÀ + PROV + NAZIONE */}
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.citta.label}
                </label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.citta.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.provincia.label}
                </label>
                <input
                  type="text"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.provincia.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Nazione
                </label>
                <div className="relative mt-1">
                  <select
                    name="nazione"
                    value={form.nazione}
                    onChange={handleChange}
                    className="mt-0 w-full appearance-none rounded-md border border-slate-200 bg-white/90 px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm shadow-slate-200/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40"
                  >
                    {NAZIONI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute inset-y-0 right-2 my-auto h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
            </div>

            {/* EMAIL + PEC */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.email.label}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.email.placeholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {CLIENTE_FIELD_CONFIG.pec.label}
                </label>
                <input
                  type="email"
                  name="pec"
                  value={form.pec}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-900 shadow-sm shadow-slate-200/60 placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40 dark:placeholder:text-slate-500"
                  placeholder={CLIENTE_FIELD_CONFIG.pec.placeholder}
                />
              </div>
            </div>

            {/* BOTTONI */}
            <div className="mt-2 flex items-center justify-end gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900/60"
                >
                  Annulla
                </button>
              )}

              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {isEditing ? 'Aggiorna cliente' : 'Salva cliente'}
              </button>
            </div>
          </form>
        </section>

        {/* LISTA CLIENTI */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-black/40">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Elenco clienti
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clicca su un cliente per modificarne i dati. I clienti saranno
                poi utilizzabili nell’apertura delle pratiche.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {totalClienti} cliente{totalClienti === 1 ? '' : 'i'} trovati
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              Caricamento clienti...
            </div>
          ) : clienti.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium">Nessun cliente inserito</p>
              <p className="mt-1 text-[11px]">
                Usa il form a sinistra per inserire il primo cliente.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/80 text-xs dark:border-slate-900 dark:bg-slate-950/50">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-900/60 dark:text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Ragione sociale</th>
                    <th className="px-3 py-2 text-left">Tipologia</th>
                    <th className="px-3 py-2 text-left">Referente</th>
                    <th className="px-3 py-2 text-left">Contatti</th>
                    <th className="px-3 py-2 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {clienti.map((c, idx) => {
                    const tipologiaLabel =
                      (c as any).tipologia &&
                      tipologiaLabelMap[(c as any).tipologia] &&
                      tipologiaLabelMap[(c as any).tipologia];

                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCliente(c)}
                        className={[
                          'cursor-pointer border-b border-slate-100 text-slate-700 hover:bg-slate-50/80 dark:border-slate-900 dark:text-slate-100 dark:hover:bg-slate-900/60',
                          idx % 2 === 0
                            ? 'bg-white dark:bg-slate-950/40'
                            : 'bg-slate-50/60 dark:bg-slate-900/40',
                          editingId === c.id
                            ? 'ring-1 ring-indigo-400 dark:ring-indigo-500'
                            : '',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2 text-xs font-medium">
                          {c.ragioneSociale}
                        </td>

                        {/* Tipologia */}
                        <td className="px-3 py-2 text-xs">
                          {tipologiaLabel || '-'}
                        </td>

                        {/* Referente */}
                        <td className="px-3 py-2 text-xs">
                          {(c as any).referente || '-'}
                        </td>

                        {/* Contatti */}
                        <td className="px-3 py-2 text-xs">
                          {c.email && (
                            <div className="text-slate-800 dark:text-slate-100">
                              {c.email}
                            </div>
                          )}
                          {c.telefono && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Tel: {c.telefono}
                            </div>
                          )}
                          {(c as any).pec && (
                            <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                              PEC attiva
                            </div>
                          )}
                          {!c.email && !c.telefono && !(c as any).pec && (
                            <span>-</span>
                          )}
                        </td>

                        {/* Azioni */}
                        <td
                          className="px-3 py-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteCliente(c)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/60"
                          >
                            Elimina
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
      </div>
    </div>
  );
}
