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
  updateDebitore,
  fetchDebitoriForCliente,
  unlinkDebitoreFromCliente,
  deactivateDebitore,
  reactivateDebitore,
  deleteDebitore,
} from '../../api/debitori';
import { useToast } from '../../components/ui/ToastProvider';

// Form state per nuovo debitore (semplificato)
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

// Form state completo per dettaglio/modifica debitore
export interface DebitoreFormState {
  tipoSoggetto: TipoSoggetto;
  // Persona fisica
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  luogoNascita: string;
  // Persona giuridica
  ragioneSociale: string;
  partitaIva: string;
  // Comuni
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  referente: string;
  telefono: string;
  email: string;
  pec: string;
}

const INITIAL_NEW_FORM: NewDebitoreFormState = {
  tipoSoggetto: 'persona_fisica',
  nome: '',
  cognome: '',
  ragioneSociale: '',
  codiceFiscale: '',
  partitaIva: '',
  telefono: '',
  email: '',
};

const INITIAL_DETAIL_FORM: DebitoreFormState = {
  tipoSoggetto: 'persona_fisica',
  nome: '',
  cognome: '',
  codiceFiscale: '',
  dataNascita: '',
  luogoNascita: '',
  ragioneSociale: '',
  partitaIva: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  nazione: '',
  referente: '',
  telefono: '',
  email: '',
  pec: '',
};

function debitoreToFormState(d: Debitore): DebitoreFormState {
  return {
    tipoSoggetto: d.tipoSoggetto,
    nome: d.nome ?? '',
    cognome: d.cognome ?? '',
    codiceFiscale: d.codiceFiscale ?? '',
    dataNascita: d.dataNascita ?? '',
    luogoNascita: d.luogoNascita ?? '',
    ragioneSociale: d.ragioneSociale ?? '',
    partitaIva: d.partitaIva ?? '',
    indirizzo: d.indirizzo ?? '',
    cap: d.cap ?? '',
    citta: d.citta ?? '',
    provincia: d.provincia ?? '',
    nazione: d.nazione ?? '',
    referente: d.referente ?? '',
    telefono: d.telefono ?? '',
    email: d.email ?? '',
    pec: d.pec ?? '',
  };
}

export function useDebitoriPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // === STATO CLIENTI ===
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loadingClienti, setLoadingClienti] = useState(true);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  // === STATO DEBITORI ===
  const [debitori, setDebitori] = useState<Debitore[]>([]);
  const [loadingDebitori, setLoadingDebitori] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // === STATO SELEZIONE DEBITORE ===
  const [selectedDebitoreId, setSelectedDebitoreId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [detailForm, setDetailForm] = useState<DebitoreFormState>(INITIAL_DETAIL_FORM);
  const [savingDetail, setSavingDetail] = useState(false);

  // === STATO NUOVO DEBITORE ===
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<NewDebitoreFormState>(INITIAL_NEW_FORM);

  // === STATO GENERALE ===
  const [error, setError] = useState<string | null>(null);

  // === COMPUTED ===
  const selectedCliente = useMemo(
    () => clienti.find((c) => c.id === selectedClienteId) ?? null,
    [clienti, selectedClienteId],
  );

  const selectedDebitore = useMemo(
    () => debitori.find((d) => d.id === selectedDebitoreId) ?? null,
    [debitori, selectedDebitoreId],
  );

  // === CARICAMENTO CLIENTI ===
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

  // === CARICAMENTO DEBITORI ===
  useEffect(() => {
    if (!selectedClienteId) {
      setDebitori([]);
      setSelectedDebitoreId(null);
      setIsEditing(false);
      return;
    }

    const loadDebitori = async () => {
      try {
        setLoadingDebitori(true);
        setError(null);
        const data = await fetchDebitoriForCliente(selectedClienteId, showInactive);
        setDebitori(data);
        setSelectedDebitoreId(null);
        setIsEditing(false);
      } catch (err: any) {
        console.error(err);
        const msg = err.message || 'Errore nel caricamento dei debitori del cliente';
        setError(msg);
        toastError(msg, 'Errore caricamento debitori');
      } finally {
        setLoadingDebitori(false);
      }
    };

    loadDebitori();
  }, [selectedClienteId, showInactive, toastError]);

  // === HANDLERS CLIENTE ===
  const handleSelectCliente = (clienteId: string | null) => {
    setSelectedClienteId(clienteId);
    setShowNewForm(false);
    setNewForm(INITIAL_NEW_FORM);
    setSelectedDebitoreId(null);
    setIsEditing(false);
  };

  // === HANDLERS SELEZIONE DEBITORE ===
  const handleSelectDebitore = (debitore: Debitore) => {
    setSelectedDebitoreId(debitore.id);
    setDetailForm(debitoreToFormState(debitore));
    setIsEditing(false);
    setShowNewForm(false);
    setError(null);
  };

  const handleCloseDetail = () => {
    setSelectedDebitoreId(null);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (selectedDebitore) {
      setDetailForm(debitoreToFormState(selectedDebitore));
    }
    setIsEditing(false);
  };

  const updateDetailForm = <K extends keyof DebitoreFormState>(
    field: K,
    value: DebitoreFormState[K],
  ) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
  };

  const isDetailFormDirty = (): boolean => {
    if (!selectedDebitore) return false;
    const original = debitoreToFormState(selectedDebitore);
    return Object.keys(detailForm).some(
      (key) => detailForm[key as keyof DebitoreFormState] !== original[key as keyof DebitoreFormState],
    );
  };

  // === SALVATAGGIO MODIFICA DEBITORE ===
  const submitDetailForm = async (): Promise<boolean> => {
    if (!selectedDebitoreId) return false;

    // Validazione
    if (detailForm.tipoSoggetto === 'persona_fisica') {
      if (!detailForm.nome.trim() || !detailForm.cognome.trim()) {
        const msg = 'Nome e cognome sono obbligatori per persona fisica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return false;
      }
    } else {
      if (!detailForm.ragioneSociale.trim()) {
        const msg = 'La ragione sociale è obbligatoria per persona giuridica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return false;
      }
    }

    try {
      setSavingDetail(true);
      setError(null);

      const payload = {
        tipoSoggetto: detailForm.tipoSoggetto,
        nome: detailForm.tipoSoggetto === 'persona_fisica' ? detailForm.nome.trim() || undefined : undefined,
        cognome: detailForm.tipoSoggetto === 'persona_fisica' ? detailForm.cognome.trim() || undefined : undefined,
        codiceFiscale: detailForm.codiceFiscale.trim() || undefined,
        dataNascita: detailForm.dataNascita || undefined,
        luogoNascita: detailForm.luogoNascita.trim() || undefined,
        ragioneSociale: detailForm.tipoSoggetto === 'persona_giuridica' ? detailForm.ragioneSociale.trim() || undefined : undefined,
        partitaIva: detailForm.partitaIva.trim() || undefined,
        indirizzo: detailForm.indirizzo.trim() || undefined,
        cap: detailForm.cap.trim() || undefined,
        citta: detailForm.citta.trim() || undefined,
        provincia: detailForm.provincia.trim() || undefined,
        nazione: detailForm.nazione.trim() || undefined,
        referente: detailForm.referente.trim() || undefined,
        telefono: detailForm.telefono.trim() || undefined,
        email: detailForm.email.trim() || undefined,
        pec: detailForm.pec.trim() || undefined,
      };

      const updated = await updateDebitore(selectedDebitoreId, payload);
      setDebitori((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setDetailForm(debitoreToFormState(updated));
      setIsEditing(false);
      toastSuccess('Debitore aggiornato correttamente', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore durante il salvataggio';
      setError(msg);
      toastError(msg, 'Errore salvataggio');
      return false;
    } finally {
      setSavingDetail(false);
    }
  };

  // === HANDLERS NUOVO DEBITORE ===
  const updateNewForm = <K extends keyof NewDebitoreFormState>(
    field: K,
    value: NewDebitoreFormState[K],
  ) => {
    setNewForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetNewForm = () => {
    setNewForm(INITIAL_NEW_FORM);
    setShowNewForm(false);
  };

  const isNewFormDirty = (): boolean => {
    return (
      newForm.nome.trim() !== '' ||
      newForm.cognome.trim() !== '' ||
      newForm.ragioneSociale.trim() !== '' ||
      newForm.codiceFiscale.trim() !== '' ||
      newForm.partitaIva.trim() !== '' ||
      newForm.telefono.trim() !== '' ||
      newForm.email.trim() !== ''
    );
  };

  const submitNewDebitore = async (): Promise<boolean> => {
    if (!selectedClienteId) {
      const msg = 'Nessun cliente selezionato.';
      setError(msg);
      toastError(msg, 'Errore');
      return false;
    }

    // Validazione base
    if (newForm.tipoSoggetto === 'persona_fisica') {
      if (!newForm.nome.trim() || !newForm.cognome.trim()) {
        const msg = 'Nome e cognome sono obbligatori per persona fisica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return false;
      }
    } else {
      if (!newForm.ragioneSociale.trim()) {
        const msg = 'Ragione sociale obbligatoria per persona giuridica.';
        setError(msg);
        toastError(msg, 'Dati mancanti');
        return false;
      }
    }

    try {
      const payload: DebitoreCreatePayload = {
        tipoSoggetto: newForm.tipoSoggetto,
        nome: newForm.nome.trim() || undefined,
        cognome: newForm.cognome.trim() || undefined,
        ragioneSociale: newForm.ragioneSociale.trim() || undefined,
        codiceFiscale: newForm.codiceFiscale.trim() || undefined,
        partitaIva: newForm.partitaIva.trim() || undefined,
        telefono: newForm.telefono.trim() || undefined,
        email: newForm.email.trim() || undefined,
        clientiIds: [selectedClienteId],
      };

      const created = await createDebitore(payload);
      setDebitori((prev) => [created, ...prev]);
      resetNewForm();
      toastSuccess('Debitore creato e collegato correttamente', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Errore nella creazione del debitore';
      setError(msg);
      toastError(msg, 'Errore creazione');
      return false;
    }
  };

  // === AZIONI DEBITORE ===
  const unlinkDebitoreAction = async (debitoreId: string): Promise<boolean> => {
    if (!selectedClienteId) return false;

    try {
      await unlinkDebitoreFromCliente(selectedClienteId, debitoreId);
      setDebitori((prev) => prev.filter((d) => d.id !== debitoreId));
      if (selectedDebitoreId === debitoreId) {
        setSelectedDebitoreId(null);
        setIsEditing(false);
      }
      toastSuccess('Debitore scollegato dal cliente', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Errore durante lo scollegamento', 'Errore');
      return false;
    }
  };

  const deactivateDebitoreAction = async (debitoreId: string): Promise<boolean> => {
    try {
      const updated = await deactivateDebitore(debitoreId);
      if (showInactive) {
        setDebitori((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        if (selectedDebitoreId === debitoreId) {
          setDetailForm(debitoreToFormState(updated));
        }
      } else {
        setDebitori((prev) => prev.filter((d) => d.id !== debitoreId));
        if (selectedDebitoreId === debitoreId) {
          setSelectedDebitoreId(null);
          setIsEditing(false);
        }
      }
      toastSuccess('Debitore disattivato', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Errore durante la disattivazione', 'Errore');
      return false;
    }
  };

  const reactivateDebitoreAction = async (debitoreId: string): Promise<boolean> => {
    try {
      const updated = await reactivateDebitore(debitoreId);
      setDebitori((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (selectedDebitoreId === debitoreId) {
        setDetailForm(debitoreToFormState(updated));
      }
      toastSuccess('Debitore riattivato', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Errore durante la riattivazione', 'Errore');
      return false;
    }
  };

  const deleteDebitoreAction = async (debitoreId: string): Promise<boolean> => {
    try {
      await deleteDebitore(debitoreId);
      setDebitori((prev) => prev.filter((d) => d.id !== debitoreId));
      if (selectedDebitoreId === debitoreId) {
        setSelectedDebitoreId(null);
        setIsEditing(false);
      }
      toastSuccess('Debitore eliminato definitivamente', 'Operazione riuscita');
      return true;
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Errore durante l\'eliminazione', 'Errore');
      return false;
    }
  };

  return {
    // Stato clienti
    clienti,
    loadingClienti,
    selectedClienteId,
    selectedCliente,

    // Stato debitori
    debitori,
    loadingDebitori,
    showInactive,
    setShowInactive,

    // Stato selezione debitore
    selectedDebitoreId,
    selectedDebitore,
    isEditing,
    detailForm,
    savingDetail,

    // Stato nuovo debitore
    showNewForm,
    newForm,

    // Stato generale
    error,
    setError,

    // Handlers cliente
    handleSelectCliente,

    // Handlers selezione debitore
    handleSelectDebitore,
    handleCloseDetail,
    handleStartEditing,
    handleCancelEditing,
    updateDetailForm,
    isDetailFormDirty,
    submitDetailForm,

    // Handlers nuovo debitore
    setShowNewForm,
    updateNewForm,
    resetNewForm,
    isNewFormDirty,
    submitNewDebitore,

    // Azioni debitore
    unlinkDebitore: unlinkDebitoreAction,
    deactivateDebitore: deactivateDebitoreAction,
    reactivateDebitore: reactivateDebitoreAction,
    deleteDebitore: deleteDebitoreAction,
  };
}