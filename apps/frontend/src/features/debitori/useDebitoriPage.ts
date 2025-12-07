// apps/frontend/src/features/debitori/useDebitoriPage.ts
import { useEffect, useMemo, useState } from 'react';
import type { Cliente } from '../../api/clienti';
import { fetchClienti } from '../../api/clienti';
import type {
  Debitore,
  DebitoreCreatePayload,
  TipoSoggetto,
} from '../../api/debitori';
import {
  createDebitore,
  fetchDebitoriForCliente,
  unlinkDebitoreFromCliente,
} from '../../api/debitori';
import { useToast } from '../../components/ui/ToastProvider';

export interface NewDebitoreFormState {
  tipoSoggetto: TipoSoggetto;
  nome: string;
  cognome: string;
  ragioneSociale: string;
  codiceFiscale: string;
  partitaIva: string;
  telefono: string;
  email: string;
}

const INITIAL_FORM: NewDebitoreFormState = {
  tipoSoggetto: 'persona_fisica',
  nome: '',
  cognome: '',
  ragioneSociale: '',
  codiceFiscale: '',
  partitaIva: '',
  telefono: '',
  email: '',
};

export function useDebitoriPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loadingClienti, setLoadingClienti] = useState(true);

  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null,
  );

  const [selectedDebitore, setSelectedDebitore] = useState<Debitore | null>(null);

  const [debitori, setDebitori] = useState<Debitore[]>([]);
  const [loadingDebitori, setLoadingDebitori] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] =
    useState<NewDebitoreFormState>(INITIAL_FORM);

  // --- Carica clienti all'avvio ---

  useEffect(() => {
    const loadClienti = async () => {
      try {
        setLoadingClienti(true);
        const data = await fetchClienti();
        setClienti(data);
      } catch (err: any) {
        console.error(err);
        const msg = err.message || 'Errore nel caricamento dei clienti';
        setError(msg);
        toastError(msg, 'Errore caricamento clienti');
      } finally {
        setLoadingClienti(false);
      }
    };

    loadClienti();
  }, [toastError]);

  // --- Cliente selezionato (oggetto) ---

  const selectedCliente = useMemo(
    () => clienti.find((c) => c.id === selectedClienteId) ?? null,
    [clienti, selectedClienteId],
  );

  // --- Carica debitori quando cambia il cliente selezionato ---

  useEffect(() => {
    if (!selectedClienteId) {
      setDebitori([]);
      setSelectedDebitore(null);  // <-- reset quando cambi cliente
      return;
    }

    const loadDebitori = async () => {
      try {
        setLoadingDebitori(true);
        setError(null);
        const data = await fetchDebitoriForCliente(selectedClienteId);
        setDebitori(data);
        setSelectedDebitore(null);  // <-- reset anche al reload della lista
      } catch (err: any) {
        console.error(err);
        const msg =
          err.message || 'Errore nel caricamento dei debitori del cliente';
        setError(msg);
        toastError(msg, 'Errore caricamento debitori');
      } finally {
        setLoadingDebitori(false);
      }
    };

    loadDebitori();
  }, [selectedClienteId, toastError]);

  // --- Gestione cambio cliente ---

  const handleSelectCliente = (clienteId: string | null) => {
    setSelectedClienteId(clienteId);
    setShowNewForm(false);
    setNewForm(INITIAL_FORM);
    setSelectedDebitore(null);
    setError(null);
  };

  // --- Selezione debitore dalla tabella ---
  
  const handleSelectDebitore = (debitore: Debitore) => {
    setSelectedDebitore(debitore);
  };

  // --- Gestione form nuovo debitore ---

  const updateNewForm = (
    field: keyof NewDebitoreFormState,
    value: string,
  ) => {
    setNewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError(null);
  };

  const resetNewForm = () => {
    setNewForm(INITIAL_FORM);
    setShowNewForm(false);
    setError(null);
  };

  const submitNewDebitore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setError('Seleziona prima un cliente.');
      toastError('Seleziona prima un cliente.', 'Cliente non selezionato');
      return;
    }

    // Validazioni minime
    if (newForm.tipoSoggetto === 'persona_fisica') {
      if (!newForm.nome.trim() || !newForm.cognome.trim()) {
        const msg = 'Nome e cognome sono obbligatori per persona fisica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return;
      }
    } else {
      if (!newForm.ragioneSociale.trim()) {
        const msg =
          'La ragione sociale è obbligatoria per persona giuridica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return;
      }
    }

    try {
      setError(null);

      const payload: DebitoreCreatePayload = {
        tipoSoggetto: newForm.tipoSoggetto,
        nome: newForm.tipoSoggetto === 'persona_fisica' ? newForm.nome : '',
        cognome:
          newForm.tipoSoggetto === 'persona_fisica'
            ? newForm.cognome
            : '',
        ragioneSociale:
          newForm.tipoSoggetto === 'persona_giuridica'
            ? newForm.ragioneSociale
            : '',
        codiceFiscale: newForm.codiceFiscale || undefined,
        partitaIva: newForm.partitaIva || undefined,
        telefono: newForm.telefono || undefined,
        email: newForm.email || undefined,
        clientiIds: [selectedClienteId],
      };

      const created = await createDebitore(payload);

      setDebitori((prev) => [created, ...prev]);
      toastSuccess(
        'Debitore creato e collegato al cliente',
        'Operazione riuscita',
      );
      resetNewForm();
      setShowNewForm(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Errore nella creazione del debitore';
      setError(msg);
      toastError(msg, 'Errore salvataggio');
    }
  };

  // --- Scollega debitore ---

  const unlinkDebitore = async (debitore: Debitore) => {
    if (!selectedClienteId) return;

    const conferma = window.confirm(
      `Scollegare il debitore selezionato dal cliente?`,
    );
    if (!conferma) return;

    try {
      await unlinkDebitoreFromCliente(selectedClienteId, debitore.id);
      setDebitori((prev) => prev.filter((d) => d.id !== debitore.id));
      setSelectedDebitore((current) =>
        current?.id === debitore.id ? null : current,
    );
      toastSuccess('Debitore scollegato dal cliente', 'Operazione riuscita');
    } catch (err: any) {
      console.error(err);
      const msg =
        err.message || 'Errore durante lo scollegamento del debitore';
      setError(msg);
      toastError(msg, 'Errore scollegamento');
    }
  };

  return {
    // stato generale
    clienti,
    loadingClienti,
    selectedClienteId,
    selectedCliente,
    debitori,
    loadingDebitori,
    error,

    // stato nuovo debitore
    showNewForm,
    newForm,

    // nuovo stato dettaglio debitore
    selectedDebitore,

    // azioni
    handleSelectCliente,
    handleSelectDebitore,
    setShowNewForm,
    updateNewForm,
    resetNewForm,
    submitNewDebitore,
    unlinkDebitore,
    setError,
  };
}
