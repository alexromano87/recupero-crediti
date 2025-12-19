// apps/frontend/src/pages/PraticaDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Save, ChevronRight, RefreshCw, ArrowLeft,
  Power, PowerOff, Trash2, ArrowRight, RotateCcw, Building2, User,
  Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Banknote,
  CalendarDays, StickyNote, History, FileEdit, Edit, Briefcase, Receipt,
  Folder, Upload, Download, Send, X, Plus, Bell, Ticket as TicketIcon, GanttChart,
} from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  fetchPratica,
  updatePratica,
  cambiaFasePratica,
  deactivatePratica,
  reactivatePratica,
  deletePratica,
  riapriPratica,
  formatCurrency,
  getDebitoreDisplayName,
  type Pratica,
  type StoricoFase,
  type PraticaUpdatePayload,
  type CambiaFasePayload,
} from '../api/pratiche';
import { fetchFasi, type Fase } from '../api/fasi';
import {
  movimentiFinanziariApi,
  getTipoMovimentoLabel,
  isRecupero,
  type MovimentoFinanziario,
  type TipoMovimento,
} from '../api/movimenti-finanziari';
import { documentiApi, type Documento } from '../api/documenti';
import {
  alertsApi,
  type Alert,
  type AlertDestinatario,
  type CreateAlertDto,
} from '../api/alerts';
import {
  ticketsApi,
  type Ticket,
  type TicketPriorita,
  type CreateTicketDto,
} from '../api/tickets';

type DetailTab = 'overview' | 'financials' | 'movimenti' | 'documenti' | 'alerts' | 'tickets' | 'chat' | 'timeline' | 'gantt';

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

export function PraticaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Data states
  const [pratica, setPratica] = useState<Pratica | null>(null);
  const [fasi, setFasi] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<PraticaUpdatePayload>({});

  // Formatted input states for editing
  const [editCapitaleInput, setEditCapitaleInput] = useState('');
  const [editImportoRecCapitaleInput, setEditImportoRecCapitaleInput] = useState('');
  const [editAnticipazioniInput, setEditAnticipazioniInput] = useState('');
  const [editImportoRecAnticipazioniInput, setEditImportoRecAnticipazioniInput] = useState('');
  const [editCompensiLegaliInput, setEditCompensiLegaliInput] = useState('');
  const [editCompensiLiquidatiInput, setEditCompensiLiquidatiInput] = useState('');
  const [editInteressiInput, setEditInteressiInput] = useState('');
  const [editInteressiRecuperatiInput, setEditInteressiRecuperatiInput] = useState('');

  // Cambio fase states
  const [showCambioFase, setShowCambioFase] = useState(false);
  const [savingCambioFase, setSavingCambioFase] = useState(false);
  const [cambioFaseData, setCambioFaseData] = useState<CambiaFasePayload>({
    nuovaFaseId: '',
    note: '',
  });

  // Storico fase modal
  const [selectedStoricoFase, setSelectedStoricoFase] = useState<StoricoFase | null>(null);

  // Movimenti states
  const [movimenti, setMovimenti] = useState<MovimentoFinanziario[]>([]);
  const [loadingMovimenti, setLoadingMovimenti] = useState(false);
  const [showMovimentoForm, setShowMovimentoForm] = useState(false);
  const [editingMovimento, setEditingMovimento] = useState<MovimentoFinanziario | null>(null);
  const [movimentoForm, setMovimentoForm] = useState({
    tipo: '' as TipoMovimento | '',
    importo: '',
    data: new Date().toISOString().split('T')[0],
    oggetto: '',
  });

  // Documenti states
  const [documenti, setDocumenti] = useState<Documento[]>([]);
  const [loadingDocumenti, setLoadingDocumenti] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Alert states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState<CreateAlertDto>({
    praticaId: id || '',
    titolo: '',
    descrizione: '',
    destinatario: 'studio' as AlertDestinatario,
    dataScadenza: new Date().toISOString().split('T')[0],
    giorniAnticipo: 7,
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertChatInput, setAlertChatInput] = useState('');

  // Ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState<CreateTicketDto>({
    praticaId: id || '',
    oggetto: '',
    descrizione: '',
    autore: 'studio',
    priorita: 'normale' as TicketPriorita,
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketChatInput, setTicketChatInput] = useState('');

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; sender: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');

  // Load initial data
  useEffect(() => {
    if (id) {
      loadPratica();
      loadFasi();
    }
  }, [id]);

  // Load related data when pratica changes
  useEffect(() => {
    if (pratica) {
      loadMovimenti();
      loadDocumenti();
      loadAlerts();
      loadTickets();
    }
  }, [pratica?.id]);

  // Initialize edit form inputs
  useEffect(() => {
    if (isEditing && pratica) {
      setEditCapitaleInput(numeroAFormatoItaliano(pratica.capitale));
      setEditImportoRecCapitaleInput(numeroAFormatoItaliano(pratica.importoRecuperatoCapitale));
      setEditAnticipazioniInput(numeroAFormatoItaliano(pratica.anticipazioni));
      setEditImportoRecAnticipazioniInput(numeroAFormatoItaliano(pratica.importoRecuperatoAnticipazioni));
      setEditCompensiLegaliInput(numeroAFormatoItaliano(pratica.compensiLegali));
      setEditCompensiLiquidatiInput(numeroAFormatoItaliano(pratica.compensiLiquidati));
      setEditInteressiInput(numeroAFormatoItaliano(pratica.interessi));
      setEditInteressiRecuperatiInput(numeroAFormatoItaliano(pratica.interessiRecuperati));
    }
  }, [isEditing, pratica]);

  const loadPratica = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPratica(id);
      setPratica(data);
    } catch (err) {
      console.error('Errore caricamento pratica:', err);
      setError('Impossibile caricare la pratica');
    } finally {
      setLoading(false);
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

  const loadMovimenti = async () => {
    if (!pratica) return;
    try {
      setLoadingMovimenti(true);
      const data = await movimentiFinanziariApi.getAllByPratica(pratica.id);
      setMovimenti(data);
    } catch (err) {
      console.error('Errore caricamento movimenti:', err);
    } finally {
      setLoadingMovimenti(false);
    }
  };

  const loadDocumenti = async () => {
    if (!pratica) return;
    try {
      setLoadingDocumenti(true);
      const data = await documentiApi.getAllByPratica(pratica.id);
      setDocumenti(data);
    } catch (err) {
      console.error('Errore caricamento documenti:', err);
    } finally {
      setLoadingDocumenti(false);
    }
  };

  const loadAlerts = async () => {
    if (!pratica) return;
    try {
      setLoadingAlerts(true);
      const data = await alertsApi.getAllByPratica(pratica.id);
      setAlerts(data);
    } catch (err) {
      console.error('Errore caricamento alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const loadTickets = async () => {
    if (!pratica) return;
    try {
      setLoadingTickets(true);
      const data = await ticketsApi.getAllByPratica(pratica.id);
      setTickets(data);
    } catch (err) {
      console.error('Errore caricamento tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleStartEditing = () => {
    if (!pratica) return;
    setEditForm({
      capitale: pratica.capitale,
      importoRecuperatoCapitale: pratica.importoRecuperatoCapitale,
      anticipazioni: pratica.anticipazioni,
      importoRecuperatoAnticipazioni: pratica.importoRecuperatoAnticipazioni,
      compensiLegali: pratica.compensiLegali,
      compensiLiquidati: pratica.compensiLiquidati,
      interessi: pratica.interessi,
      interessiRecuperati: pratica.interessiRecuperati,
      note: pratica.note,
      dataAffidamento: pratica.dataAffidamento,
      avvocatiIds: pratica.avvocati?.map((a) => a.id) || [],
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const updateEditForm = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitEditForm = async () => {
    if (!pratica) return;
    try {
      setSavingEdit(true);
      await updatePratica(pratica.id, editForm);
      await loadPratica();
      setIsEditing(false);
      setEditForm({});
    } catch (err) {
      console.error('Errore aggiornamento pratica:', err);
      alert('Errore durante il salvataggio');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenCambioFase = () => {
    setCambioFaseData({ nuovaFaseId: '', note: '' });
    setShowCambioFase(true);
  };

  const handleCloseCambioFase = () => {
    setShowCambioFase(false);
    setCambioFaseData({ nuovaFaseId: '', note: '' });
  };

  const updateCambioFaseData = (field: keyof CambiaFasePayload, value: string) => {
    setCambioFaseData((prev) => ({ ...prev, [field]: value }));
  };

  const submitCambioFase = async () => {
    if (!pratica || !cambioFaseData.nuovaFaseId) return;
    try {
      setSavingCambioFase(true);
      await cambiaFasePratica(pratica.id, cambioFaseData);
      await loadPratica();
      handleCloseCambioFase();
    } catch (err) {
      console.error('Errore cambio fase:', err);
      alert('Errore durante il cambio fase');
    } finally {
      setSavingCambioFase(false);
    }
  };

  const handleDeactivatePratica = async () => {
    if (!pratica) return;
    try {
      await deactivatePratica(pratica.id);
      await loadPratica();
    } catch (err) {
      console.error('Errore disattivazione pratica:', err);
    }
  };

  const handleReactivatePratica = async () => {
    if (!pratica) return;
    try {
      await reactivatePratica(pratica.id);
      await loadPratica();
    } catch (err) {
      console.error('Errore riattivazione pratica:', err);
    }
  };

  const handleDeletePratica = async () => {
    if (!pratica) return;
    try {
      await deletePratica(pratica.id);
      navigate('/pratiche');
    } catch (err) {
      console.error('Errore eliminazione pratica:', err);
    }
  };

  const handleRiapriPratica = async () => {
    if (!pratica) return;
    try {
      await riapriPratica(pratica.id);
      await loadPratica();
    } catch (err) {
      console.error('Errore riapertura pratica:', err);
    }
  };

  // Movimenti handlers
  const handleSaveMovimento = async () => {
    if (!pratica || !movimentoForm.tipo) return;

    const importo = formatoItalianoANumero(movimentoForm.importo);
    if (importo <= 0) return;

    try {
      if (editingMovimento) {
        await movimentiFinanziariApi.update(editingMovimento.id, {
          tipo: movimentoForm.tipo as TipoMovimento,
          importo,
          data: movimentoForm.data,
          oggetto: movimentoForm.oggetto || undefined,
        });
      } else {
        await movimentiFinanziariApi.create({
          praticaId: pratica.id,
          tipo: movimentoForm.tipo as TipoMovimento,
          importo,
          data: movimentoForm.data,
          oggetto: movimentoForm.oggetto || undefined,
        });
      }
      await loadMovimenti();
      setShowMovimentoForm(false);
      resetMovimentoForm();
    } catch (err) {
      console.error('Errore salvataggio movimento:', err);
    }
  };

  const handleDeleteMovimento = async (movimentoId: string) => {
    if (
      await confirm({
        title: 'Elimina movimento',
        message: "Confermi l'eliminazione di questo movimento?",
        confirmText: 'Elimina',
        variant: 'danger',
      })
    ) {
      try {
        await movimentiFinanziariApi.delete(movimentoId);
        await loadMovimenti();
      } catch (err) {
        console.error('Errore eliminazione movimento:', err);
      }
    }
  };

  const handleEditMovimento = (movimento: MovimentoFinanziario) => {
    setEditingMovimento(movimento);
    setMovimentoForm({
      tipo: movimento.tipo,
      importo: numeroAFormatoItaliano(movimento.importo),
      data: movimento.data,
      oggetto: movimento.oggetto || '',
    });
    setShowMovimentoForm(true);
  };

  const resetMovimentoForm = () => {
    setMovimentoForm({
      tipo: '',
      importo: '',
      data: new Date().toISOString().split('T')[0],
      oggetto: '',
    });
    setEditingMovimento(null);
  };

  // Documenti handlers
  const handleUploadDocument = async () => {
    if (!pratica || !uploadFile) return;
    try {
      await documentiApi.upload({
        file: uploadFile,
        praticaId: pratica.id,
      });
      await loadDocumenti();
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err) {
      console.error('Errore upload documento:', err);
      alert('Errore durante il caricamento del documento');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (
      await confirm({
        title: 'Elimina documento',
        message: "Confermi l'eliminazione di questo documento?",
        confirmText: 'Elimina',
        variant: 'danger',
      })
    ) {
      try {
        await documentiApi.delete(docId);
        await loadDocumenti();
      } catch (err) {
        console.error('Errore eliminazione documento:', err);
      }
    }
  };

  // Chat handlers
  const handleSendMessage = () => {
    if (!chatInput.trim() || !pratica) return;
    const newMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: 'Alessandro Romano',
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');
  };

  // Confirm handlers
  const handleDeactivate = async () => {
    if (
      await confirm({
        title: 'Disattiva pratica',
        message: 'Sei sicuro?',
        confirmText: 'Disattiva',
        variant: 'warning',
      })
    )
      await handleDeactivatePratica();
  };

  const handleDelete = async () => {
    if (
      await confirm({
        title: 'Elimina pratica',
        message: 'Eliminare definitivamente?',
        confirmText: 'Elimina',
        variant: 'danger',
      })
    )
      await handleDeletePratica();
  };

  const handleRiapri = async () => {
    if (
      await confirm({
        title: 'Riapri pratica',
        message: 'Riaprire la pratica?',
        confirmText: 'Riapri',
        variant: 'info',
      })
    )
      await handleRiapriPratica();
  };

  const handleCambiaFaseWithConfirm = async () => {
    const nuovaFase = fasi.find((f) => f.id === cambioFaseData.nuovaFaseId);
    if (!nuovaFase) return;
    if (
      await confirm({
        title: 'Conferma cambio fase',
        message: `Passare a "${nuovaFase.nome}"?${nuovaFase.isFaseChiusura ? '\n\n⚠️ La pratica verrà chiusa.' : ''}`,
        confirmText: nuovaFase.isFaseChiusura ? 'Chiudi pratica' : 'Avanza',
        variant: nuovaFase.isFaseChiusura ? 'warning' : 'info',
      })
    )
      await submitCambioFase();
  };

  const getFaseById = (faseId: string): Fase | undefined => {
    return fasi.find((f) => f.id === faseId);
  };

  const fasiDisponibili = pratica
    ? fasi.filter((f) => {
        const faseCorrente = getFaseById(pratica.faseId);
        return faseCorrente ? f.ordine > faseCorrente.ordine : false;
      })
    : [];

  const faseOptions = fasiDisponibili.map((f) => ({
    value: f.id,
    label: f.nome,
    sublabel: f.isFaseChiusura ? 'Fase di chiusura' : undefined,
  }));

  // === RENDER: Progress Stepper ===
  const renderProgressStepper = () => {
    if (!pratica) return null;
    const storico = pratica.storico || [];
    const completedFaseIds = storico.filter((s) => s.dataFine).map((s) => s.faseId);
    const allFasi = fasi.filter((f) => !f.isFaseChiusura).slice(0, 10);

    return (
      <div className="py-4 px-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {allFasi.map((fase, idx) => {
            const isCompleted = completedFaseIds.includes(fase.id);
            const isCurrent = fase.id === pratica.faseId;
            const storicoEntry = storico.find((s) => s.faseId === fase.id);
            const hasNotes = storicoEntry?.note;

            return (
              <div key={fase.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => storicoEntry && setSelectedStoricoFase(storicoEntry)}
                  disabled={!storicoEntry}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      isCurrent
                        ? 'bg-indigo-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="text-left">
                    <span
                      className={`text-xs font-semibold whitespace-nowrap block ${
                        isCurrent
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : isCompleted
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {fase.nome}
                    </span>
                    {isCurrent && <span className="text-[10px] text-indigo-500 dark:text-indigo-400">In corso</span>}
                    {isCompleted && <span className="text-[10px] text-emerald-500 dark:text-emerald-400">Completata</span>}
                  </div>
                  {hasNotes && <MessageSquare className="h-3.5 w-3.5 text-emerald-500 ml-1" />}
                </button>
                {idx < allFasi.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mx-1 rounded ${
                      isCompleted ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // === RENDER: Tab Overview ===
  const renderOverviewTab = () => {
    if (!pratica) return null;
    const fase = getFaseById(pratica.faseId);
    const storicoCorrente = pratica.storico?.find((s) => s.faseId === pratica.faseId && !s.dataFine);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Fase corrente</p>
              <p className="text-2xl font-bold mt-1">{fase?.nome || 'N/D'}</p>
              <p className="text-sm text-indigo-200 mt-2">
                Iniziata il {storicoCorrente ? new Date(storicoCorrente.dataInizio).toLocaleDateString('it-IT') : '-'}
              </p>
            </div>
            {pratica.aperta && pratica.attivo && (
              <button
                onClick={handleOpenCambioFase}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition backdrop-blur-sm"
              >
                <ArrowRight className="h-4 w-4" />
                Avanza fase
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Note pratica</h3>
          </div>
          {isEditing ? (
            <textarea
              value={editForm.note || ''}
              onChange={(e) => updateEditForm('note', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Aggiungi note..."
            />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{pratica.note || 'Nessuna nota'}</p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cliente</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{pratica.cliente?.ragioneSociale}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Debitore</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getDebitoreDisplayName(pratica.debitore)}</p>
        </div>

        <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avvocati</span>
          </div>
          {pratica.avvocati && pratica.avvocati.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pratica.avvocati.map((avv) => (
                <span
                  key={avv.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                >
                  {avv.nome} {avv.cognome}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nessun avvocato associato</p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data affidamento</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pratica.dataAffidamento ? new Date(pratica.dataAffidamento).toLocaleDateString('it-IT') : '-'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Stato</span>
          </div>
          {pratica.aperta ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
              <Clock className="h-3 w-3" />
              In corso
            </span>
          ) : pratica.esito === 'positivo' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              Chiusa +
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
              <XCircle className="h-3 w-3" />
              Chiusa -
            </span>
          )}
        </div>
      </div>
    );
  };

  // === RENDER: Tab Financials ===
  const renderFinancialsTab = () => {
    if (!pratica) return null;

    const renderAmountCard = (
      label: string,
      amount: number,
      recovered: number,
      color: string,
      amountInput: string,
      setAmountInput: (value: string) => void,
      amountFieldName: string,
      recoveredInput: string,
      setRecoveredInput: (value: string) => void,
      recoveredFieldName: string
    ) => {
      const percentage = amount > 0 ? Math.round((recovered / amount) * 100) : 0;
      return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</p>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Importo totale</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    onFocus={() => setAmountInput(amount ? amount.toString().replace('.', ',') : '')}
                    onBlur={(e) => {
                      const n = formatoItalianoANumero(e.target.value);
                      updateEditForm(amountFieldName, n);
                      setAmountInput(numeroAFormatoItaliano(n));
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-6 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Importo recuperato</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={recoveredInput}
                    onChange={(e) => setRecoveredInput(e.target.value)}
                    onFocus={() => setRecoveredInput(recovered ? recovered.toString().replace('.', ',') : '')}
                    onBlur={(e) => {
                      const n = formatoItalianoANumero(e.target.value);
                      updateEditForm(recoveredFieldName, n);
                      setRecoveredInput(numeroAFormatoItaliano(n));
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-6 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">€ {formatCurrency(amount)}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Recuperato</span>
                  <span className="font-bold" style={{ color }}>
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">€ {formatCurrency(recovered)}</p>
              </div>
            </>
          )}
        </div>
      );
    };

    const totale = pratica.capitale + pratica.anticipazioni + pratica.compensiLegali + pratica.interessi;
    const totaleRecuperato =
      pratica.importoRecuperatoCapitale +
      pratica.importoRecuperatoAnticipazioni +
      pratica.compensiLiquidati +
      pratica.interessiRecuperati;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAmountCard(
          'Capitale',
          pratica.capitale,
          pratica.importoRecuperatoCapitale,
          '#10B981',
          editCapitaleInput,
          setEditCapitaleInput,
          'capitale',
          editImportoRecCapitaleInput,
          setEditImportoRecCapitaleInput,
          'importoRecuperatoCapitale'
        )}
        {renderAmountCard(
          'Anticipazioni',
          pratica.anticipazioni,
          pratica.importoRecuperatoAnticipazioni,
          '#F59E0B',
          editAnticipazioniInput,
          setEditAnticipazioniInput,
          'anticipazioni',
          editImportoRecAnticipazioniInput,
          setEditImportoRecAnticipazioniInput,
          'importoRecuperatoAnticipazioni'
        )}
        {renderAmountCard(
          'Compensi legali',
          pratica.compensiLegali,
          pratica.compensiLiquidati,
          '#6366F1',
          editCompensiLegaliInput,
          setEditCompensiLegaliInput,
          'compensiLegali',
          editCompensiLiquidatiInput,
          setEditCompensiLiquidatiInput,
          'compensiLiquidati'
        )}
        {renderAmountCard(
          'Interessi',
          pratica.interessi,
          pratica.interessiRecuperati,
          '#EC4899',
          editInteressiInput,
          setEditInteressiInput,
          'interessi',
          editInteressiRecuperatiInput,
          setEditInteressiRecuperatiInput,
          'interessiRecuperati'
        )}
        {!isEditing && (
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Totale da recuperare</p>
                <p className="text-3xl font-bold mt-1">€ {formatCurrency(totale)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Totale recuperato</p>
                <p className="text-3xl font-bold mt-1 text-emerald-400">€ {formatCurrency(totaleRecuperato)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Movimenti ===
  const renderMovimentiTab = () => {
    if (!pratica) return null;

    const tipoMovimentoOptions = [
      { value: 'capitale', label: 'Capitale' },
      { value: 'anticipazione', label: 'Anticipazione' },
      { value: 'compenso', label: 'Compenso' },
      { value: 'interessi', label: 'Interessi' },
      { value: 'recupero_capitale', label: 'Recupero Capitale' },
      { value: 'recupero_anticipazione', label: 'Recupero Anticipazione' },
      { value: 'recupero_compenso', label: 'Recupero Compenso' },
      { value: 'recupero_interessi', label: 'Recupero Interessi' },
    ];

    // Raggruppa movimenti per tipo e calcola totali
    const totali = (movimenti || []).reduce(
      (acc, m) => {
        const importo = Number(m.importo);
        if (m.tipo === 'capitale') acc.capitale += importo;
        else if (m.tipo === 'anticipazione') acc.anticipazioni += importo;
        else if (m.tipo === 'compenso') acc.compensi += importo;
        else if (m.tipo === 'interessi') acc.interessi += importo;
        else if (m.tipo === 'recupero_capitale') acc.recuperoCapitale += importo;
        else if (m.tipo === 'recupero_anticipazione') acc.recuperoAnticipazioni += importo;
        else if (m.tipo === 'recupero_compenso') acc.recuperoCompensi += importo;
        else if (m.tipo === 'recupero_interessi') acc.recuperoInteressi += importo;
        return acc;
      },
      {
        capitale: 0,
        anticipazioni: 0,
        compensi: 0,
        interessi: 0,
        recuperoCapitale: 0,
        recuperoAnticipazioni: 0,
        recuperoCompensi: 0,
        recuperoInteressi: 0,
      }
    );

    return (
      <div className="space-y-4">
        {/* Totali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">DARE</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Capitale:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.capitale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Anticipazioni:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.anticipazioni)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Compensi:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.compensi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Interessi:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.interessi)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">AVERE</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recupero Capitale:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.recuperoCapitale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recupero Anticip.:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totali.recuperoAnticipazioni)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recupero Compensi:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.recuperoCompensi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recupero Interessi:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totali.recuperoInteressi)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista movimenti */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Movimenti</h4>
          <button
            onClick={() => setShowMovimentoForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-3 w-3" />
            Nuovo movimento
          </button>
        </div>

        {loadingMovimenti ? (
          <div className="text-center py-8 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : !movimenti || movimenti.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessun movimento registrato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movimenti
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .map((mov) => (
                <div
                  key={mov.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isRecupero(mov.tipo)
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isRecupero(mov.tipo) ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {getTipoMovimentoLabel(mov.tipo)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(mov.data).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    {mov.oggetto && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{mov.oggetto}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${
                        isRecupero(mov.tipo) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatCurrency(mov.importo)}
                    </span>
                    <button
                      onClick={() => handleEditMovimento(mov)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMovimento(mov.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Modal Form Movimento */}
        {showMovimentoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowMovimentoForm(false);
                resetMovimentoForm();
              }}
            />
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {editingMovimento ? 'Modifica movimento' : 'Nuovo movimento'}
                </h2>
                <button
                  onClick={() => {
                    setShowMovimentoForm(false);
                    resetMovimentoForm();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                  <CustomSelect
                    options={tipoMovimentoOptions}
                    value={movimentoForm.tipo}
                    onChange={(tipo) => setMovimentoForm((prev) => ({ ...prev, tipo: tipo as TipoMovimento }))}
                    placeholder="Seleziona tipo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Importo *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={movimentoForm.importo}
                      onChange={(e) => setMovimentoForm((prev) => ({ ...prev, importo: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    value={movimentoForm.data}
                    onChange={(e) => setMovimentoForm((prev) => ({ ...prev, data: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Oggetto</label>
                  <textarea
                    value={movimentoForm.oggetto}
                    onChange={(e) => setMovimentoForm((prev) => ({ ...prev, oggetto: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Descrizione movimento..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowMovimentoForm(false);
                    resetMovimentoForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveMovimento}
                  disabled={!movimentoForm.tipo || !movimentoForm.importo}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Documenti ===
  const renderDocumentiTab = () => {
    if (!pratica) return null;

    const getTipoDocumentoColor = (tipo: string) => {
      switch (tipo) {
        case 'pdf':
          return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
        case 'word':
          return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        case 'excel':
          return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        case 'immagine':
          return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
        default:
          return 'text-slate-600 bg-slate-50 dark:bg-slate-800';
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Documenti della pratica</h4>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Upload className="h-3 w-3" />
            Carica documento
          </button>
        </div>

        {loadingDocumenti ? (
          <div className="text-center py-8 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : !documenti || documenti.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Folder className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessun documento caricato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documenti.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTipoDocumentoColor(doc.tipo)}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{doc.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {doc.estensione.toUpperCase()} • {(doc.dimensione / 1024).toFixed(0)} KB
                    </p>
                    {doc.descrizione && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">{doc.descrizione}</p>}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(doc.dataCreazione).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => documentiApi.download(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                      title="Scarica"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Elimina"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowUploadModal(false);
                setUploadFile(null);
              }}
            />
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Carica documento</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seleziona file *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300"
                  />
                  {uploadFile && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      File: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={!uploadFile}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Carica
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Alerts ===
  const renderAlertsTab = () => {
    if (!pratica) return null;

    const handleCreateAlert = async () => {
      try {
        await alertsApi.create({
          ...alertForm,
          praticaId: pratica.id,
        });
        await loadAlerts();
        setShowAlertForm(false);
        setAlertForm({
          praticaId: pratica.id,
          titolo: '',
          descrizione: '',
          destinatario: 'studio',
          dataScadenza: new Date().toISOString().split('T')[0],
          giorniAnticipo: 7,
        });
      } catch (err) {
        console.error('Errore creazione alert:', err);
        alert('Errore durante la creazione dell\'alert');
      }
    };

    const handleChiudiAlert = async (alertId: string) => {
      try {
        await alertsApi.chiudi(alertId);
        await loadAlerts();
        setSelectedAlert(null);
      } catch (err) {
        console.error('Errore chiusura alert:', err);
        alert('Errore durante la chiusura dell\'alert');
      }
    };

    const handleSendAlertMessage = async (alertId: string) => {
      if (!alertChatInput.trim()) return;
      try {
        await alertsApi.addMessaggio(alertId, {
          autore: 'studio',
          testo: alertChatInput,
        });
        await loadAlerts();
        setAlertChatInput('');
        const updatedAlert = alerts.find((a) => a.id === alertId);
        if (updatedAlert) {
          setSelectedAlert(await alertsApi.getOne(alertId));
        }
      } catch (err) {
        console.error('Errore invio messaggio:', err);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Alert e Scadenze ({alerts.length})
          </h3>
          <button
            onClick={() => setShowAlertForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nuovo Alert
          </button>
        </div>

        {loadingAlerts ? (
          <div className="text-center py-8 text-slate-500">Caricamento...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessun alert presente</p>
            <p className="text-xs text-slate-400 mt-1">Crea un alert per gestire scadenze e adempimenti</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50">{alert.titolo}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          alert.stato === 'in_gestione'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {alert.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{alert.descrizione}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Scadenza: {new Date(alert.dataScadenza).toLocaleDateString('it-IT')}</span>
                      <span>Destinatario: {alert.destinatario === 'studio' ? 'Studio' : 'Cliente'}</span>
                      <span>Messaggi: {alert.messaggi?.length || 0}</span>
                    </div>
                  </div>
                  {alert.stato === 'in_gestione' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChiudiAlert(alert.id);
                      }}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Chiudi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Alert Form */}
        {showAlertForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAlertForm(false)} />
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuovo Alert</h2>
                <button onClick={() => setShowAlertForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titolo *</label>
                  <input
                    type="text"
                    value={alertForm.titolo}
                    onChange={(e) => setAlertForm({ ...alertForm, titolo: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrizione *</label>
                  <textarea
                    value={alertForm.descrizione}
                    onChange={(e) => setAlertForm({ ...alertForm, descrizione: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destinatario *</label>
                  <select
                    value={alertForm.destinatario}
                    onChange={(e) => setAlertForm({ ...alertForm, destinatario: e.target.value as AlertDestinatario })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="studio">Studio</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data scadenza *</label>
                    <input
                      type="date"
                      value={typeof alertForm.dataScadenza === 'string' ? alertForm.dataScadenza : new Date(alertForm.dataScadenza).toISOString().split('T')[0]}
                      onChange={(e) => setAlertForm({ ...alertForm, dataScadenza: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Giorni anticipo</label>
                    <input
                      type="number"
                      value={alertForm.giorniAnticipo}
                      onChange={(e) => setAlertForm({ ...alertForm, giorniAnticipo: Number(e.target.value) })}
                      min={1}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAlertForm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreateAlert}
                    disabled={!alertForm.titolo || !alertForm.descrizione}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Crea Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert Detail */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
            <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedAlert.titolo}</h2>
                <button onClick={() => setSelectedAlert(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedAlert.descrizione}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>Scadenza: {new Date(selectedAlert.dataScadenza).toLocaleDateString('it-IT')}</span>
                    <span>Destinatario: {selectedAlert.destinatario === 'studio' ? 'Studio' : 'Cliente'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        selectedAlert.stato === 'in_gestione'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {selectedAlert.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Chat</h3>
                  <div className="space-y-3 mb-4">
                    {(!selectedAlert.messaggi || selectedAlert.messaggi.length === 0) ? (
                      <p className="text-sm text-slate-500">Nessun messaggio</p>
                    ) : (
                      selectedAlert.messaggi.map((msg) => (
                        <div key={msg.id} className="flex gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{msg.autore}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(msg.dataInvio).toLocaleString('it-IT')}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
                              {msg.testo}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedAlert.stato === 'in_gestione' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={alertChatInput}
                        onChange={(e) => setAlertChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendAlertMessage(selectedAlert.id)}
                        placeholder="Scrivi un messaggio..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleSendAlertMessage(selectedAlert.id)}
                        disabled={!alertChatInput.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Tickets ===
  const renderTicketsTab = () => {
    if (!pratica) return null;

    const handleCreateTicket = async () => {
      try {
        await ticketsApi.create({
          ...ticketForm,
          praticaId: pratica.id,
        });
        await loadTickets();
        setShowTicketForm(false);
        setTicketForm({
          praticaId: pratica.id,
          oggetto: '',
          descrizione: '',
          autore: 'studio',
          priorita: 'normale',
        });
      } catch (err) {
        console.error('Errore creazione ticket:', err);
        alert('Errore durante la creazione del ticket');
      }
    };

    const handleChiudiTicket = async (ticketId: string) => {
      try {
        await ticketsApi.chiudi(ticketId);
        await loadTickets();
        setSelectedTicket(null);
      } catch (err) {
        console.error('Errore chiusura ticket:', err);
        alert('Errore durante la chiusura del ticket');
      }
    };

    const handlePrendiInCaricoTicket = async (ticketId: string) => {
      try {
        await ticketsApi.prendiInCarico(ticketId);
        await loadTickets();
        const updatedTicket = await ticketsApi.getOne(ticketId);
        setSelectedTicket(updatedTicket);
      } catch (err) {
        console.error('Errore presa in carico:', err);
      }
    };

    const handleSendTicketMessage = async (ticketId: string) => {
      if (!ticketChatInput.trim()) return;
      try {
        await ticketsApi.addMessaggio(ticketId, {
          autore: 'studio',
          testo: ticketChatInput,
        });
        await loadTickets();
        setTicketChatInput('');
        const updatedTicket = await ticketsApi.getOne(ticketId);
        setSelectedTicket(updatedTicket);
      } catch (err) {
        console.error('Errore invio messaggio:', err);
      }
    };

    const getPrioritaColor = (priorita: TicketPriorita) => {
      switch (priorita) {
        case 'urgente':
          return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'alta':
          return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        case 'normale':
          return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'bassa':
          return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
        default:
          return 'bg-slate-100 text-slate-700';
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Ticket di Supporto ({tickets.length})
          </h3>
          <button
            onClick={() => setShowTicketForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nuovo Ticket
          </button>
        </div>

        {loadingTickets ? (
          <div className="text-center py-8 text-slate-500">Caricamento...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessun ticket presente</p>
            <p className="text-xs text-slate-400 mt-1">Crea un ticket per richiedere supporto</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{ticket.numeroTicket}</span>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50">{ticket.oggetto}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPrioritaColor(ticket.priorita)}`}>
                        {ticket.priorita}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          ticket.stato === 'aperto'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : ticket.stato === 'in_gestione'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {ticket.stato === 'aperto' ? 'Aperto' : ticket.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{ticket.descrizione}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Autore: {ticket.autore}</span>
                      <span>Messaggi: {ticket.messaggi?.length || 0}</span>
                      <span>Creato: {new Date(ticket.dataCreazione).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                  {ticket.stato !== 'chiuso' && (
                    <div className="flex gap-2">
                      {ticket.stato === 'aperto' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrendiInCaricoTicket(ticket.id);
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          Prendi in carico
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChiudiTicket(ticket.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Chiudi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Ticket Form */}
        {showTicketForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTicketForm(false)} />
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuovo Ticket</h2>
                <button onClick={() => setShowTicketForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Oggetto *</label>
                  <input
                    type="text"
                    value={ticketForm.oggetto}
                    onChange={(e) => setTicketForm({ ...ticketForm, oggetto: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrizione *</label>
                  <textarea
                    value={ticketForm.descrizione}
                    onChange={(e) => setTicketForm({ ...ticketForm, descrizione: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priorità</label>
                  <select
                    value={ticketForm.priorita}
                    onChange={(e) => setTicketForm({ ...ticketForm, priorita: e.target.value as TicketPriorita })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="bassa">Bassa</option>
                    <option value="normale">Normale</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowTicketForm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreateTicket}
                    disabled={!ticketForm.oggetto || !ticketForm.descrizione}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Crea Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ticket Detail */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
            <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{selectedTicket.numeroTicket}</span>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedTicket.oggetto}</h2>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedTicket.descrizione}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${getPrioritaColor(selectedTicket.priorita)}`}>
                      {selectedTicket.priorita}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        selectedTicket.stato === 'aperto'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : selectedTicket.stato === 'in_gestione'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {selectedTicket.stato === 'aperto' ? 'Aperto' : selectedTicket.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                    </span>
                    <span className="text-slate-500">Autore: {selectedTicket.autore}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Conversazione</h3>
                  <div className="space-y-3 mb-4">
                    {(!selectedTicket.messaggi || selectedTicket.messaggi.length === 0) ? (
                      <p className="text-sm text-slate-500">Nessun messaggio</p>
                    ) : (
                      selectedTicket.messaggi.map((msg) => (
                        <div key={msg.id} className="flex gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{msg.autore}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(msg.dataInvio).toLocaleString('it-IT')}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
                              {msg.testo}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedTicket.stato !== 'chiuso' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ticketChatInput}
                        onChange={(e) => setTicketChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendTicketMessage(selectedTicket.id)}
                        placeholder="Scrivi un messaggio..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleSendTicketMessage(selectedTicket.id)}
                        disabled={!ticketChatInput.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Chat ===
  const renderChatTab = () => {
    if (!pratica) return null;

    return (
      <div className="flex flex-col h-[400px]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nessun messaggio</p>
              <p className="text-xs text-slate-400 mt-1">Inizia una conversazione per questa pratica</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                  {msg.sender
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{msg.sender}</span>
                    <span className="text-xs text-slate-400">
                      {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Scrivi un messaggio..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // === RENDER: Tab Gantt ===
  const renderGanttTab = () => {
    if (!pratica) return null;

    // Raccolta degli eventi da visualizzare
    const events: Array<{
      id: string;
      title: string;
      date: Date;
      type: 'alert' | 'fase' | 'creazione' | 'chiusura';
      status?: string;
    }> = [];

    // Aggiunta apertura pratica
    events.push({
      id: 'creazione',
      title: 'Apertura Pratica',
      date: new Date(pratica.dataAffidamento || pratica.createdAt),
      type: 'creazione',
    });

    // Aggiunta alerts con scadenze
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert) => {
        events.push({
          id: alert.id,
          title: alert.titolo,
          date: new Date(alert.dataScadenza),
          type: 'alert',
          status: alert.stato,
        });
      });
    }

    // Aggiunta storico fasi
    if (pratica.storico && pratica.storico.length > 0) {
      pratica.storico.forEach((st, idx) => {
        const fase = fasi.find((f) => f.id === st.faseId);
        if (st.dataInizio) {
          events.push({
            id: `fase-inizio-${st.faseId}-${idx}`,
            title: `Inizio: ${fase?.nome || 'Fase'}`,
            date: new Date(st.dataInizio),
            type: 'fase',
          });
        }
        if (st.dataFine) {
          events.push({
            id: `fase-fine-${st.faseId}-${idx}`,
            title: `Fine: ${fase?.nome || 'Fase'}`,
            date: new Date(st.dataFine),
            type: 'fase',
          });
        }
      });
    }

    // Aggiunta chiusura pratica (se chiusa)
    if (!pratica.aperta && pratica.updatedAt) {
      events.push({
        id: 'chiusura',
        title: 'Chiusura Pratica',
        date: new Date(pratica.updatedAt),
        type: 'chiusura',
      });
    }

    // Ordinamento per data
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcolo range temporale
    const now = new Date();
    const dates = events.map((e) => e.date.getTime());
    const minDate = dates.length > 0 ? Math.min(...dates) : now.getTime();
    const maxDate = dates.length > 0 ? Math.max(...dates, now.getTime()) : now.getTime();
    const range = maxDate - minDate;

    // Funzione per calcolare posizione percentuale
    const getPosition = (date: Date) => {
      if (range === 0) return 50;
      return ((date.getTime() - minDate) / range) * 100;
    };

    // Colori per tipo
    const getEventColor = (event: typeof events[0]) => {
      switch (event.type) {
        case 'creazione':
          return 'bg-blue-500';
        case 'alert':
          return event.status === 'chiuso' ? 'bg-gray-400' : 'bg-amber-500';
        case 'fase':
          return 'bg-indigo-500';
        case 'chiusura':
          return 'bg-green-500';
        default:
          return 'bg-slate-500';
      }
    };

    const getEventIcon = (event: typeof events[0]) => {
      switch (event.type) {
        case 'creazione':
          return <FileText className="h-3 w-3" />;
        case 'alert':
          return <Bell className="h-3 w-3" />;
        case 'fase':
          return <Clock className="h-3 w-3" />;
        case 'chiusura':
          return <CheckCircle className="h-3 w-3" />;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Diagramma di Gantt - Timeline Pratica
          </h3>
          <div className="text-xs text-slate-500">
            {events.length} eventi totali
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <GanttChart className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessun evento da visualizzare</p>
            <p className="text-xs text-slate-400 mt-1">
              Gli eventi e le scadenze appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Timeline grafica */}
            <div className="relative">
              {/* Linea temporale principale */}
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {/* Indicatore oggi */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${getPosition(now)}%` }}
                >
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-red-500 font-semibold whitespace-nowrap">
                    Oggi
                  </div>
                </div>

                {/* Eventi sulla timeline */}
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${getPosition(event.date)}%` }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${getEventColor(event)} border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-125 transition`}
                      title={`${event.title} - ${event.date.toLocaleDateString('it-IT')}`}
                    >
                      {getEventIcon(event)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Date minima e massima */}
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>{new Date(minDate).toLocaleDateString('it-IT')}</span>
                <span>{new Date(maxDate).toLocaleDateString('it-IT')}</span>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Legenda:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Apertura</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Alert Attivo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Alert Chiuso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Fase</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Chiusura</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-red-500"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Oggi</span>
              </div>
            </div>

            {/* Lista eventi */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Eventi in ordine cronologico
              </h4>
              <div className="space-y-2">
                {events.map((event) => {
                  const isPast = event.date < now;
                  const isToday =
                    event.date.toDateString() === now.toDateString();

                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isToday
                          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                          : isPast
                          ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/50'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${getEventColor(event)} text-white`}
                      >
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {event.title}
                          </h5>
                          {isToday && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              OGGI
                            </span>
                          )}
                          {event.type === 'alert' && event.status && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                event.status === 'chiuso'
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                            >
                              {event.status === 'chiuso' ? 'Chiuso' : 'In gestione'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {event.date.toLocaleDateString('it-IT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {isPast && !isToday && ' (passato)'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // === RENDER: Tab Timeline ===
  const renderTimelineTab = () => {
    if (!pratica?.storico?.length)
      return (
        <div className="text-center py-12 text-slate-500">
          <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nessuno storico</p>
        </div>
      );
    return (
      <div className="relative pl-4">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-emerald-300 to-slate-200 dark:from-indigo-600 dark:via-emerald-600 dark:to-slate-700" />
        <div className="space-y-4">
          {pratica.storico.map((s, idx) => {
            // Una fase è completata se ha dataFine OPPURE se è l'ultima fase e la pratica è chiusa
            const isFaseChiusura = fasi.find(f => f.id === s.faseId)?.isFaseChiusura;
            const isCompleted = !!s.dataFine || (isFaseChiusura && !pratica.aperta);
            return (
              <div key={idx} className="relative pl-8">
                <div
                  className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                    isCompleted ? 'bg-emerald-500' : 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/50'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-3 w-3 text-white" />
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
                <button
                  onClick={() => setSelectedStoricoFase(s)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                      : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                  } cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`font-semibold ${
                          isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {s.faseNome}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(s.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {s.dataFine &&
                          ` → ${new Date(s.dataFine).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.note && <MessageSquare className={`h-4 w-4 ${isCompleted ? 'text-emerald-500' : 'text-indigo-500'}`} />}
                      {!isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300">
                          In corso
                        </span>
                      )}
                      <ChevronRight className={`h-4 w-4 ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`} />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !pratica) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <p className="text-lg text-slate-600 dark:text-slate-400">{error || 'Pratica non trovata'}</p>
        <button
          onClick={() => navigate('/pratiche')}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Torna alla lista
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header con breadcrumb e azioni */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/pratiche')}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle pratiche
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {pratica.cliente?.ragioneSociale} vs {getDebitoreDisplayName(pratica.debitore)}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Pratica #{pratica.id.slice(0, 8)} • Fase: {getFaseById(pratica.faseId)?.nome || 'N/D'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!pratica.aperta && pratica.attivo && (
                <button
                  onClick={handleRiapri}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Riapri
                </button>
              )}
              {!isEditing && pratica.attivo && (
                <button
                  onClick={handleStartEditing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"
                >
                  <Edit className="h-4 w-4" />
                  Modifica
                </button>
              )}
              {pratica.attivo ? (
                <button
                  onClick={handleDeactivate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800"
                >
                  <PowerOff className="h-4 w-4" />
                  Disattiva
                </button>
              ) : (
                <button
                  onClick={handleReactivatePratica}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800"
                >
                  <Power className="h-4 w-4" />
                  Riattiva
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30 dark:border-rose-800"
              >
                <Trash2 className="h-4 w-4" />
                Elimina
              </button>
            </div>
          </div>

          {!pratica.attivo && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Pratica disattivata
            </div>
          )}
        </div>

        {/* Progress Stepper */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
          {renderProgressStepper()}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Panoramica', icon: FileEdit },
              { id: 'financials', label: 'Importi', icon: Banknote },
              { id: 'movimenti', label: 'Movimenti', icon: Receipt },
              { id: 'documenti', label: 'Documenti', icon: Folder },
              { id: 'alerts', label: 'Alert', icon: Bell },
              { id: 'tickets', label: 'Ticket', icon: TicketIcon },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'timeline', label: 'Timeline', icon: History },
              { id: 'gantt', label: 'Gantt', icon: GanttChart },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'financials' && renderFinancialsTab()}
          {activeTab === 'movimenti' && renderMovimentiTab()}
          {activeTab === 'documenti' && renderDocumentiTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'tickets' && renderTicketsTab()}
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'timeline' && renderTimelineTab()}
          {activeTab === 'gantt' && renderGanttTab()}
        </div>

        {/* Editing Footer */}
        {isEditing && (
          <div className="mt-6 flex items-center justify-end gap-3 p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90">
            <button
              onClick={handleCancelEditing}
              disabled={savingEdit}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
            >
              Annulla
            </button>
            <button
              onClick={submitEditForm}
              disabled={savingEdit}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingEdit ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        )}
      </div>

      {/* Modal Cambio Fase */}
      {showCambioFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseCambioFase} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Avanza fase</h2>
              <button onClick={handleCloseCambioFase} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prossima fase *</label>
                <CustomSelect
                  options={faseOptions}
                  value={cambioFaseData.nuovaFaseId}
                  onChange={(id) => updateCambioFaseData('nuovaFaseId', id)}
                  placeholder="Seleziona fase..."
                />
                {fasiDisponibili.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">Nessuna fase successiva disponibile.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note chiusura fase</label>
                <textarea
                  value={cambioFaseData.note}
                  onChange={(e) => updateCambioFaseData('note', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Note..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseCambioFase}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
              >
                Annulla
              </button>
              <button
                onClick={handleCambiaFaseWithConfirm}
                disabled={savingCambioFase || !cambioFaseData.nuovaFaseId}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
                {savingCambioFase ? 'Cambio...' : 'Avanza'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Storico Fase */}
      {selectedStoricoFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStoricoFase(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-full ${
                    selectedStoricoFase.dataFine ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'
                  }`}
                >
                  {selectedStoricoFase.dataFine ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedStoricoFase.faseNome}</h2>
                  <p className="text-xs text-slate-500">{selectedStoricoFase.dataFine ? 'Fase completata' : 'Fase in corso'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStoricoFase(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Inizio</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(selectedStoricoFase.dataInizio).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl ${
                    selectedStoricoFase.dataFine ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-indigo-50 dark:bg-indigo-900/30'
                  }`}
                >
                  <p
                    className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${
                      selectedStoricoFase.dataFine ? 'text-emerald-600' : 'text-indigo-600'
                    }`}
                  >
                    {selectedStoricoFase.dataFine ? 'Fine' : 'Stato'}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      selectedStoricoFase.dataFine
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {selectedStoricoFase.dataFine
                      ? new Date(selectedStoricoFase.dataFine).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'In corso'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">Note</p>
                {selectedStoricoFase.note ? (
                  <div
                    className={`p-3 rounded-xl border-l-4 ${
                      selectedStoricoFase.dataFine
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                        : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                    }`}
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedStoricoFase.note}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Nessuna nota</p>
                )}
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedStoricoFase(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
