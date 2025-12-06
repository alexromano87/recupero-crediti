import { useEffect, useState } from 'react';
import type { Cliente } from '../api/clienti';
import { fetchClienti, createCliente } from '../api/clienti';

export function ClientiPage() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ragioneSociale: '',
    partitaIva: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    nazione: 'IT',
    telefono: '',
    email: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchClienti();
        setClienti(data);
        setError(null);
      } catch (e: any) {
        setError(e.message ?? 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const nuovo = await createCliente({
        ...form,
        codiceFiscale: undefined,
      } as any);
      setClienti((prev) => [nuovo, ...prev]);
      setForm({
        ragioneSociale: '',
        partitaIva: '',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        nazione: 'IT',
        telefono: '',
        email: '',
      });
    } catch (e: any) {
      setError(e.message ?? 'Errore nella creazione del cliente');
    }
  };

  return (
    <div className="space-y-6">
      {/* RIGA STATISTICHE + AZIONI */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Anagrafiche
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Clienti dello studio
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Gestisci le anagrafiche dei soggetti creditori collegati alle pratiche
            di recupero. I dati inseriti qui saranno richiamabili in tutte le
            maschere del gestionale.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="hidden rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 shadow-sm shadow-black/30 sm:flex sm:flex-col sm:justify-center">
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Totale clienti
            </span>
            <span className="text-sm font-semibold text-slate-50">
              {clienti.length.toString().padStart(2, '0')}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500"
          >
            + Nuovo cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">
          {error}
        </div>
      )}

      {/* FORM & LISTA AFFIANCATI SU DESKTOP */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        {/* FORM */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-black/40">
          <h3 className="mb-3 text-sm font-semibold text-slate-50">
            Nuovo cliente
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 text-xs text-slate-200"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-400">
                Ragione sociale*
              </label>
              <input
                type="text"
                name="ragioneSociale"
                value={form.ragioneSociale}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 shadow-inner shadow-black/40 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Partita IVA
                </label>
                <input
                  type="text"
                  name="partitaIva"
                  value={form.partitaIva}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Telefono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400">
                Indirizzo
              </label>
              <input
                type="text"
                name="indirizzo"
                value={form.indirizzo}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  CAP
                </label>
                <input
                  type="text"
                  name="cap"
                  value={form.cap}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400">
                  Città
                </label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Provincia
                </label>
                <input
                  type="text"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Nazione
                </label>
                <select
                  name="nazione"
                  value={form.nazione}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="IT">Italia</option>
                  <option value="CH">Svizzera</option>
                  <option value="DE">Germania</option>
                </select>
              </div>
            </div>

            <div className="mt-1 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500"
              >
                Salva cliente
              </button>
            </div>
          </form>
        </section>

        {/* LISTA CLIENTI */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-black/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-50">
              Elenco clienti
            </h3>
            <p className="text-[11px] text-slate-400">
              {loading
                ? 'Caricamento in corso...'
                : clienti.length === 0
                ? 'Nessun cliente inserito'
                : `${clienti.length} cliente${clienti.length > 1 ? 'i' : ''} trovati`}
            </p>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Caricamento…</p>
          ) : clienti.length === 0 ? (
            <p className="text-xs text-slate-400">
              Non ci sono ancora clienti. Utilizza il form a sinistra per
              aggiungerne uno.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
              <table className="min-w-full border-collapse text-xs text-slate-100">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-medium text-slate-400">
                      Ragione sociale
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-medium text-slate-400">
                      P. IVA
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-medium text-slate-400">
                      Città
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-medium text-slate-400">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clienti.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={
                        idx % 2 === 0
                          ? 'bg-slate-950/50'
                          : 'bg-slate-900/50'
                      }
                    >
                      <td className="border-b border-slate-900 px-3 py-2">
                        <div className="font-medium text-slate-50">
                          {c.ragioneSociale}
                        </div>
                      </td>
                      <td className="border-b border-slate-900 px-3 py-2 text-slate-300">
                        {c.partitaIva || '-'}
                      </td>
                      <td className="border-b border-slate-900 px-3 py-2 text-slate-300">
                        {c.citta || '-'}
                      </td>
                      <td className="border-b border-slate-900 px-3 py-2 text-slate-300">
                        {c.email || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
