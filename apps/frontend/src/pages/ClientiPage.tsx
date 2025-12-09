import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  Search,
  X,
} from 'lucide-react';
import type { Cliente } from '../api/clienti';
import {
  fetchClienti,
  createCliente,
  updateCliente,
  deleteCliente,
  deactivateCliente,
  reactivateCliente,
} from '../api/clienti';
import { useToast } from '../components/ui/ToastProvider';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

type ClienteFormState = {
  ragioneSociale: string;
  codiceFiscale: string;
  partitaIva: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  telefono: string;
  email: string;
};

const EMPTY_FORM: ClienteFormState = {
  ragioneSociale: '',
  codiceFiscale: '',
  partitaIva: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  nazione: '',
  telefono: '',
  email: '',
};

function clienteToFormState(c: Cliente | null): ClienteFormState {
  if (!c) return EMPTY_FORM;
  return {
    ragioneSociale: c.ragioneSociale ?? '',
    codiceFiscale: c.codiceFiscale ?? '',
    partitaIva: c.partitaIva ?? '',
    indirizzo: c.indirizzo ?? '',
    cap: c.cap ?? '',
    citta: c.citta ?? '',
    provincia: c.provincia ?? '',
    nazione: c.nazione ?? '',
    telefono: c.telefono ?? '',
    email: c.email ?? '',
  };
}

export function ClientiPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { id: urlClienteId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ClienteFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // <-- nuova logica
  const [showInactive, setShowInactive] = useState(false); // <-- mostra/nascondi disattivati
  const [searchTerm, setSearchTerm] = useState(''); // <-- filtro ricerca

  // Flag per tracciare se abbiamo già gestito il parametro URL
  const [urlParamHandled, setUrlParamHandled] = useState(false);

  const selectedCliente =
    clienti.find((c) => c.id === selectedClienteId) ?? null;

  // Filtra clienti in base al termine di ricerca
  const filteredClienti = React.useMemo(() => {
    if (!searchTerm.trim()) return clienti;
    const term = searchTerm.toLowerCase().trim();
    return clienti.filter((c) =>
      c.ragioneSociale?.toLowerCase().includes(term) ||
      c.partitaIva?.toLowerCase().includes(term) ||
      c.codiceFiscale?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefono?.includes(term) ||
      c.citta?.toLowerCase().includes(term) ||
      c.indirizzo?.toLowerCase().includes(term)
    );
  }, [clienti, searchTerm]);

  const isNew = !selectedClienteId; // true se sto creando
  const isFormReadOnly = !!selectedClienteId && !isEditing;

  // --- Caricamento iniziale clienti ---
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchClienti(showInactive);
        setClienti(data);
      } catch (err: any) {
        console.error(err);
        const msg =
          err?.message || 'Errore nel caricamento della lista clienti';
        setError(msg);
        toastError(msg, 'Errore caricamento clienti');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toastError, showInactive]);

  // --- Gestione parametro URL (seleziona cliente da ricerca) ---
  useEffect(() => {
    // Se abbiamo un ID nell'URL e i clienti sono caricati
    if (urlClienteId && clienti.length > 0 && !urlParamHandled) {
      const cliente = clienti.find((c) => c.id === urlClienteId);
      if (cliente) {
        // Seleziona il cliente e apri il form
        setSelectedClienteId(cliente.id);
        setForm(clienteToFormState(cliente));
        setShowForm(true);
        setIsEditing(false);
        setError(null);
      } else {
        // Cliente non trovato (potrebbe essere disattivato)
        // Prova a cercarlo includendo i disattivati
        if (!showInactive) {
          setShowInactive(true);
        } else {
          toastError('Cliente non trovato', 'Errore');
          navigate('/clienti', { replace: true });
        }
      }
      setUrlParamHandled(true);
      // Pulisci l'URL mantenendo la pagina
      navigate('/clienti', { replace: true });
    }
  }, [urlClienteId, clienti, urlParamHandled, showInactive, navigate, toastError]);

  // --- Helpers form ---
  const resetForm = () => {
    setSelectedClienteId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setIsEditing(false);
  };

  // Verifica se il form è stato modificato rispetto ai dati originali
  const isFormDirty = (): boolean => {
    if (isNew) {
      // Per nuovo cliente, dirty se almeno un campo non è vuoto
      return Object.values(form).some((v) => v.trim() !== '');
    }
    if (!selectedCliente) return false;
    const original = clienteToFormState(selectedCliente);
    return Object.keys(form).some(
      (key) => form[key as keyof ClienteFormState] !== original[key as keyof ClienteFormState],
    );
  };

  const handleNewCliente = () => {
    resetForm();
    setIsEditing(true); // nuovo cliente: subito in modifica
    setShowForm(true);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedClienteId(cliente.id);
    setForm(clienteToFormState(cliente));
    setShowForm(true);
    setIsEditing(false); // view mode: campi bloccati
    setError(null);
  };

  const handleFormChange =
    (field: keyof ClienteFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };

  // --- Submit form (create/update) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.ragioneSociale.trim()) {
      const msg = 'La ragione sociale è obbligatoria.';
      setError(msg);
      toastError(msg, 'Dati mancanti');
      return;
    }

    // Conferma salvataggio
    const conferma = await confirm({
      title: isNew ? 'Creare il cliente?' : 'Salvare le modifiche?',
      message: isNew ? (
        <>
          Stai per creare il cliente <strong>{form.ragioneSociale.trim()}</strong>.
        </>
      ) : (
        <>
          Stai per salvare le modifiche al cliente <strong>{form.ragioneSociale.trim()}</strong>.
        </>
      ),
      confirmText: isNew ? 'Crea cliente' : 'Salva modifiche',
      cancelText: 'Annulla',
      variant: 'default',
    });
    if (!conferma) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ragioneSociale: form.ragioneSociale.trim(),
        codiceFiscale: form.codiceFiscale.trim() || undefined,
        partitaIva: form.partitaIva.trim() || undefined,
        indirizzo: form.indirizzo.trim() || undefined,
        cap: form.cap.trim() || undefined,
        citta: form.citta.trim() || undefined,
        provincia: form.provincia.trim() || undefined,
        nazione: form.nazione.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
      };

      let saved: Cliente;

      if (isNew) {
        // CREAZIONE
        saved = await createCliente(payload as any);
        setClienti((prev) => [saved, ...prev]);
        toastSuccess('Cliente creato correttamente', 'Operazione riuscita');
      } else {
        // UPDATE
        saved = await updateCliente(selectedClienteId as string, payload as any);
        setClienti((prev) =>
          prev.map((c) => (c.id === saved.id ? saved : c)),
        );
        toastSuccess('Cliente aggiornato correttamente', 'Operazione riuscita');
      }

      setSelectedClienteId(saved.id);
      setForm(clienteToFormState(saved));
      setIsEditing(false); // dopo il salvataggio torno in view mode
      // se vuoi chiudere il form dopo il salvataggio:
      // setShowForm(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore durante il salvataggio del cliente';
      setError(msg);
      toastError(msg, 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // --- Eliminazione cliente ---
  const handleDelete = async (cliente: Cliente) => {
    const conferma = await confirm({
      title: 'Eliminare definitivamente?',
      message: (
        <>
          Stai per eliminare il cliente <strong>{cliente.ragioneSociale}</strong>.
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

    try {
      await deleteCliente(cliente.id);
      setClienti((prev) => prev.filter((c) => c.id !== cliente.id));
      if (selectedClienteId === cliente.id) {
        resetForm();
        setShowForm(false);
      }
      toastSuccess('Cliente eliminato', 'Operazione riuscita');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore durante l\'eliminazione del cliente';
      setError(msg);
      toastError(msg, 'Errore eliminazione');
    }
  };

  // --- Disattivazione cliente (soft-delete) ---
  const handleDeactivate = async (cliente: Cliente) => {
    const conferma = await confirm({
      title: 'Disattivare cliente?',
      message: (
        <>
          Stai per disattivare il cliente <strong>{cliente.ragioneSociale}</strong>.
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            Il cliente non sarà più visibile nella lista principale ma potrà essere riattivato.
          </span>
        </>
      ),
      confirmText: 'Disattiva',
      cancelText: 'Annulla',
      variant: 'warning',
    });
    if (!conferma) return;

    try {
      const updated = await deactivateCliente(cliente.id);
      if (showInactive) {
        setClienti((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        setClienti((prev) => prev.filter((c) => c.id !== cliente.id));
      }
      if (selectedClienteId === cliente.id) {
        resetForm();
        setShowForm(false);
      }
      toastSuccess('Cliente disattivato', 'Operazione riuscita');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore durante la disattivazione';
      toastError(msg, 'Errore disattivazione');
    }
  };

  // --- Riattivazione cliente ---
  const handleReactivate = async (cliente: Cliente) => {
    const conferma = await confirm({
      title: 'Riattivare cliente?',
      message: (
        <>
          Stai per riattivare il cliente <strong>{cliente.ragioneSociale}</strong>.
          <br />
          <span className="text-slate-500 dark:text-slate-400">
            Il cliente tornerà visibile nella lista principale.
          </span>
        </>
      ),
      confirmText: 'Riattiva',
      cancelText: 'Annulla',
      variant: 'info',
    });
    if (!conferma) return;

    try {
      const updated = await reactivateCliente(cliente.id);
      setClienti((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      toastSuccess('Cliente riattivato', 'Operazione riuscita');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore durante la riattivazione';
      toastError(msg, 'Errore riattivazione');
    }
  };

  // --- Etichette bottoni form ---
  const primaryLabel = isNew
    ? saving
      ? 'Salvataggio...'
      : 'Crea cliente'
    : isEditing
    ? saving
      ? 'Salvataggio...'
      : 'Salva modifiche'
    : 'Modifica';

  const secondaryLabel = isNew
    ? 'Annulla'
    : isEditing
    ? 'Annulla modifiche'
    : 'Chiudi';

  const handleSecondaryClick = async () => {
    if (isNew) {
      // Nuovo cliente: chiedo conferma solo se ci sono dati inseriti
      if (isFormDirty()) {
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
          cancelText: 'Continua a modificare',
          variant: 'warning',
        });
        if (!conferma) return;
      }
      resetForm();
      setShowForm(false);
    } else if (isEditing) {
      // Annulla modifiche: chiedo conferma solo se il form è stato modificato
      if (isFormDirty()) {
        const conferma = await confirm({
          title: 'Annullare le modifiche?',
          message: (
            <>
              Hai modificato i dati del cliente.
              <br />
              <span className="text-slate-500 dark:text-slate-400">
                Se annulli, le modifiche non salvate andranno perse.
              </span>
            </>
          ),
          confirmText: 'Sì, annulla modifiche',
          cancelText: 'Continua a modificare',
          variant: 'warning',
        });
        if (!conferma) return;
      }
      if (selectedCliente) setForm(clienteToFormState(selectedCliente));
      setIsEditing(false);
    } else {
      // Solo chiudi vista (nessuna conferma necessaria)
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Anagrafiche
          </p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Clienti
          </h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Clicca su un cliente per vederne il dettaglio. I campi diventano
            modificabili solo dopo aver premuto il pulsante &quot;Modifica&quot;.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-600/80 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">
          {error}
        </div>
      )}

      {/* CONTENUTO: FORM + LISTA CON TRANSIZIONE */}
      <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start transition-all duration-300 ease-out">
        {/* FORM CLIENTE */}
        <section
          className={
            'rounded-2xl border border-slate-200 bg-white/90 text-xs shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/40 overflow-hidden transition-all duration-300 ease-out ' +
            (showForm
              ? 'max-h-[1600px] md:basis-5/12 opacity-100 translate-y-0'
              : 'max-h-0 md:basis-0 opacity-0 -translate-y-1 pointer-events-none')
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {selectedCliente ? 'Dettaglio cliente' : 'Nuovo cliente'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                if (isNew) resetForm();
              }}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Chiudi
            </button>
          </div>

          <div className="px-4 py-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Ragione sociale */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  Ragione sociale *
                </label>
                <input
                  type="text"
                  value={form.ragioneSociale}
                  onChange={handleFormChange('ragioneSociale')}
                  disabled={isFormReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                />
              </div>

              {/* CF / P.IVA */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Codice fiscale
                  </label>
                  <input
                    type="text"
                    value={form.codiceFiscale}
                    onChange={handleFormChange('codiceFiscale')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={form.partitaIva}
                    onChange={handleFormChange('partitaIva')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Indirizzo */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={form.indirizzo}
                  onChange={handleFormChange('indirizzo')}
                  disabled={isFormReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium">
                    CAP
                  </label>
                  <input
                    type="text"
                    value={form.cap}
                    onChange={handleFormChange('cap')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium">
                    Città
                  </label>
                  <input
                    type="text"
                    value={form.citta}
                    onChange={handleFormChange('citta')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={form.provincia}
                    onChange={handleFormChange('provincia')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium">
                  Nazione
                </label>
                <input
                  type="text"
                  value={form.nazione}
                  onChange={handleFormChange('nazione')}
                  disabled={isFormReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                />
              </div>

              {/* Contatti */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium">
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={handleFormChange('telefono')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleFormChange('email')}
                    disabled={isFormReadOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSecondaryClick}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                >
                  {secondaryLabel}
                </button>
                <button
                  type={isNew || isEditing ? 'submit' : 'button'}
                  disabled={saving && (isNew || isEditing)}
                  onClick={(e) => {
                    // caso cliente esistente in sola lettura: attivo la modifica
                    if (!isNew && !isEditing) {
                      e.preventDefault();
                      setIsEditing(true);
                    }
                    // negli altri casi (nuovo o in editing) non faccio nulla qui:
                    // il click viene gestito da onSubmit del form
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {primaryLabel}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* LISTA CLIENTI */}
        <section
          className={
            'rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40 transition-all duration-300 ease-out ' +
            (showForm ? 'md:basis-7/12' : 'md:basis-full')
          }
        >
          <div className="mb-3 flex flex-col gap-3">
            {/* Header con titolo e bottoni */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Elenco clienti
              </h3>
              <div className="flex items-center gap-2">
                {/* Toggle mostra disattivati */}
                <button
                  type="button"
                  onClick={() => setShowInactive((prev) => !prev)}
                  className={
                    'inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ' +
                    (showInactive
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800')
                  }
                  title={showInactive ? 'Nascondi disattivati' : 'Mostra disattivati'}
                >
                  {showInactive ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {showInactive ? 'Nascondi disattivati' : 'Mostra disattivati'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNewCliente}
                  className="hidden items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:bg-indigo-500 dark:hover:bg-indigo-400 md:inline-flex"
                >
                  <Plus className="h-3 w-3" />
                  Nuovo cliente
                </button>
              </div>
            </div>

            {/* Campo di ricerca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, P.IVA, città, email..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Conteggio risultati */}
            {searchTerm && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {filteredClienti.length} cliente{filteredClienti.length !== 1 ? 'i' : ''} trovato{filteredClienti.length !== 1 ? 'i' : ''}
                {filteredClienti.length !== clienti.length && ` su ${clienti.length}`}
              </p>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Caricamento clienti...
            </p>
          ) : clienti.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nessun cliente presente. Usa &quot;Nuovo cliente&quot; per
              inserirne uno.
            </p>
          ) : filteredClienti.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nessun cliente trovato per &quot;{searchTerm}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Cancella ricerca
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Contatti</th>
                    <th className="px-3 py-2 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClienti.map((c) => {
                    const isSelected = c.id === selectedClienteId;
                    const isInactive = c.attivo === false;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCliente(c)}
                        className={
                          'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60 ' +
                          (isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-900/30'
                            : '') +
                          (isInactive ? ' opacity-60' : '')
                        }
                      >
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-50">
                          <div className="flex items-center gap-2">
                            <Building2
                              className={
                                'h-3 w-3 ' +
                                (isInactive
                                  ? 'text-slate-300 dark:text-slate-600'
                                  : 'text-slate-400')
                              }
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span>{c.ragioneSociale}</span>
                                {isInactive && (
                                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                    Disattivato
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {c.partitaIva
                                  ? `P.IVA ${c.partitaIva}`
                                  : c.codiceFiscale || ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          <div>{c.email || '-'}</div>
                          <div className="text-[11px] text-slate-400">
                            {c.telefono || ''}
                          </div>
                        </td>
                        <td
                          className="px-3 py-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {/* Bottone Disattiva/Riattiva */}
                            {isInactive ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(c)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                title="Riattiva cliente"
                              >
                                <Power className="h-3 w-3" />
                                <span className="hidden sm:inline">Riattiva</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(c)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                                title="Disattiva cliente"
                              >
                                <PowerOff className="h-3 w-3" />
                                <span className="hidden sm:inline">Disattiva</span>
                              </button>
                            )}
                            {/* Bottone Elimina (solo per disattivati o senza pratiche) */}
                            {isInactive && (
                              <button
                                type="button"
                                onClick={() => handleDelete(c)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
                                title="Elimina definitivamente"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden sm:inline">Elimina</span>
                              </button>
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

      {/* Dialogo di conferma */}
      <ConfirmDialog />
    </div>
  );
}