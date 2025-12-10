// apps/frontend/src/pages/PratichePage.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Eye, EyeOff, X, Save, ChevronRight, RefreshCw,
  Power, PowerOff, Trash2, ArrowRight, RotateCcw, Building2, User,
  Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Banknote,
  CalendarDays, StickyNote, History, FileEdit,
} from 'lucide-react';
import { usePratichePage } from '../features/pratiche/usePratichePage';
import { formatCurrency, getDebitoreDisplayName, type StoricoFase } from '../api/pratiche';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

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

type DetailTab = 'overview' | 'financials' | 'timeline';

export function PratichePage() {
  const {
    pratiche, loadingPratiche, fasi, clienti, loadingClienti,
    debitoriForCliente, loadingDebitori, error, filterClienteId,
    showInactive, setShowInactive, handleFilterByCliente,
    selectedPratica, handleSelectPratica, handleCloseDetail,
    showNewForm, setShowNewForm, newForm, updateNewForm, resetNewForm,
    submitNewPratica, savingNew, isEditing, editForm, updateEditForm,
    handleStartEditing, handleCancelEditing, submitEditForm, savingEdit,
    showCambioFase, cambioFaseData, fasiDisponibili, handleOpenCambioFase,
    handleCloseCambioFase, updateCambioFaseData, submitCambioFase,
    savingCambioFase, handleRiapriPratica, handleDeactivatePratica,
    handleReactivatePratica, handleDeletePratica, getFaseById, refreshPratiche,
  } = usePratichePage();

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [capitaleInput, setCapitaleInput] = useState('');
  const [selectedStoricoFase, setSelectedStoricoFase] = useState<StoricoFase | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [noteNuovaPratica, setNoteNuovaPratica] = useState('');

  const showDetail = !!selectedPratica;

  // Handlers con conferma
  const handleDeactivate = async () => {
    if (await confirm({ title: 'Disattiva pratica', message: 'Sei sicuro?', confirmText: 'Disattiva', variant: 'warning' }))
      await handleDeactivatePratica();
  };

  const handleDelete = async () => {
    if (await confirm({ title: 'Elimina pratica', message: 'Eliminare definitivamente?', confirmText: 'Elimina', variant: 'danger' }))
      await handleDeletePratica();
  };

  const handleRiapri = async () => {
    if (await confirm({ title: 'Riapri pratica', message: 'Riaprire la pratica?', confirmText: 'Riapri', variant: 'info' }))
      await handleRiapriPratica();
  };

  const handleCreatePratica = async () => {
    const cliente = clienti.find(c => c.id === newForm.clienteId);
    const debitore = debitoriForCliente.find(d => d.id === newForm.debitoreId);
    const clienteNome = cliente?.ragioneSociale || 'Cliente';
    const debitoreNome = debitore?.tipoSoggetto === 'persona_fisica'
      ? `${debitore.nome} ${debitore.cognome}`.trim() : debitore?.ragioneSociale || 'Debitore';
    const capitaleStr = newForm.capitale ? `€ ${newForm.capitale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : 'non specificato';

    if (await confirm({ title: 'Conferma apertura', message: `Cliente: ${clienteNome}\nDebitore: ${debitoreNome}\nCapitale: ${capitaleStr}`, confirmText: 'Apri pratica', variant: 'info' })) {
      if (noteNuovaPratica.trim()) updateNewForm('note', noteNuovaPratica.trim());
      await submitNewPratica();
      setCapitaleInput('');
      setNoteNuovaPratica('');
    }
  };

  const handleCambiaFaseWithConfirm = async () => {
    const nuovaFase = fasi.find(f => f.id === cambioFaseData.nuovaFaseId);
    if (!nuovaFase) return;
    if (await confirm({
      title: 'Conferma cambio fase',
      message: `Passare a "${nuovaFase.nome}"?${nuovaFase.isFaseChiusura ? '\n\n⚠️ La pratica verrà chiusa.' : ''}`,
      confirmText: nuovaFase.isFaseChiusura ? 'Chiudi pratica' : 'Avanza',
      variant: nuovaFase.isFaseChiusura ? 'warning' : 'info',
    })) await submitCambioFase();
  };

  const fasiAvanzamento = useMemo(() => {
    if (!selectedPratica) return fasiDisponibili;
    const faseCorrente = getFaseById(selectedPratica.faseId);
    if (!faseCorrente) return fasiDisponibili;
    return fasiDisponibili.filter(f => f.ordine > faseCorrente.ordine);
  }, [selectedPratica, fasiDisponibili, getFaseById]);

  const debitoreOptions = debitoriForCliente.map(d => ({
    value: d.id,
    label: d.tipoSoggetto === 'persona_fisica' ? `${d.nome} ${d.cognome}`.trim() : d.ragioneSociale || '',
    sublabel: d.tipoSoggetto === 'persona_fisica' ? d.codiceFiscale : d.partitaIva,
  }));

  const faseOptions = fasiAvanzamento.map(f => ({
    value: f.id,
    label: f.nome,
    sublabel: f.isFaseChiusura ? 'Fase di chiusura' : undefined,
  }));

  // === RENDER: Progress Stepper ===
  const renderProgressStepper = () => {
    if (!selectedPratica) return null;
    const storico = selectedPratica.storico || [];
    const completedFaseIds = storico.filter(s => s.dataFine).map(s => s.faseId);
    const allFasi = fasi.filter(f => !f.isFaseChiusura).slice(0, 10);

    return (
      <div className="py-4 px-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {allFasi.map((fase, idx) => {
            const isCompleted = completedFaseIds.includes(fase.id);
            const isCurrent = fase.id === selectedPratica.faseId;
            const storicoEntry = storico.find(s => s.faseId === fase.id);
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                    isCurrent ? 'bg-indigo-500 text-white' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                    'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="text-left">
                    <span className={`text-xs font-semibold whitespace-nowrap block ${
                      isCurrent ? 'text-indigo-700 dark:text-indigo-300' :
                      isCompleted ? 'text-emerald-700 dark:text-emerald-300' :
                      'text-slate-500 dark:text-slate-400'
                    }`}>{fase.nome}</span>
                    {isCurrent && <span className="text-[10px] text-indigo-500 dark:text-indigo-400">In corso</span>}
                    {isCompleted && <span className="text-[10px] text-emerald-500 dark:text-emerald-400">Completata</span>}
                  </div>
                  {hasNotes && <MessageSquare className="h-3.5 w-3.5 text-emerald-500 ml-1" />}
                </button>
                {idx < allFasi.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 rounded ${isCompleted ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
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
    if (!selectedPratica) return null;
    const fase = getFaseById(selectedPratica.faseId);
    const storicoCorrente = selectedPratica.storico?.find(s => s.faseId === selectedPratica.faseId && !s.dataFine);

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
            {selectedPratica.aperta && selectedPratica.attivo && (
              <button onClick={handleOpenCambioFase} className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition backdrop-blur-sm">
                <ArrowRight className="h-4 w-4" />Avanza fase
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-indigo-500" /><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Note pratica</h3></div>
            {!isEditing && selectedPratica.attivo && <button onClick={handleStartEditing} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Modifica</button>}
          </div>
          {isEditing ? (
            <textarea value={editForm.note || ''} onChange={e => updateEditForm('note', e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" placeholder="Aggiungi note..." />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedPratica.note || 'Nessuna nota'}</p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cliente</span></div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPratica.cliente?.ragioneSociale}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2"><User className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Debitore</span></div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getDebitoreDisplayName(selectedPratica.debitore)}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data affidamento</span></div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPratica.dataAffidamento ? new Date(selectedPratica.dataAffidamento).toLocaleDateString('it-IT') : '-'}</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Stato</span></div>
          {selectedPratica.aperta ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"><Clock className="h-3 w-3" />In corso</span>
          ) : selectedPratica.esito === 'positivo' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"><CheckCircle className="h-3 w-3" />Chiusa +</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"><XCircle className="h-3 w-3" />Chiusa -</span>
          )}
        </div>
      </div>
    );
  };

  // === RENDER: Tab Financials ===
  const renderFinancialsTab = () => {
    if (!selectedPratica) return null;
    const renderAmountCard = (label: string, amount: number, recovered: number, color: string) => {
      const percentage = amount > 0 ? Math.round((recovered / amount) * 100) : 0;
      return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">€ {formatCurrency(amount)}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Recuperato</span>
              <span className="font-bold" style={{ color }}>{percentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">€ {formatCurrency(recovered)}</p>
          </div>
        </div>
      );
    };
    const totale = selectedPratica.capitale + selectedPratica.anticipazioni + selectedPratica.compensiLegali + selectedPratica.interessi;
    const totaleRecuperato = selectedPratica.importoRecuperatoCapitale + selectedPratica.importoRecuperatoAnticipazioni + selectedPratica.compensiLiquidati + selectedPratica.interessiRecuperati;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAmountCard('Capitale', selectedPratica.capitale, selectedPratica.importoRecuperatoCapitale, '#10B981')}
        {renderAmountCard('Anticipazioni', selectedPratica.anticipazioni, selectedPratica.importoRecuperatoAnticipazioni, '#F59E0B')}
        {renderAmountCard('Compensi legali', selectedPratica.compensiLegali, selectedPratica.compensiLiquidati, '#6366F1')}
        {renderAmountCard('Interessi', selectedPratica.interessi, selectedPratica.interessiRecuperati, '#EC4899')}
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Totale da recuperare</p><p className="text-3xl font-bold mt-1">€ {formatCurrency(totale)}</p></div>
            <div className="text-right"><p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Totale recuperato</p><p className="text-3xl font-bold mt-1 text-emerald-400">€ {formatCurrency(totaleRecuperato)}</p></div>
          </div>
        </div>
      </div>
    );
  };

  // === RENDER: Tab Timeline ===
  const renderTimelineTab = () => {
    if (!selectedPratica?.storico?.length) return <div className="text-center py-12 text-slate-500"><History className="h-10 w-10 mx-auto mb-3 opacity-40" /><p className="text-sm">Nessuno storico</p></div>;
    return (
      <div className="relative pl-4">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-emerald-300 to-slate-200 dark:from-indigo-600 dark:via-emerald-600 dark:to-slate-700" />
        <div className="space-y-4">
          {selectedPratica.storico.map((s, idx) => {
            const isCompleted = !!s.dataFine;
            return (
              <div key={idx} className="relative pl-8">
                <div className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/50'}`}>
                  {isCompleted ? <CheckCircle className="h-3 w-3 text-white" /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
                <button onClick={() => setSelectedStoricoFase(s)} className={`w-full text-left p-4 rounded-xl border transition-all ${isCompleted ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'} cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-indigo-700 dark:text-indigo-300'}`}>{s.faseNome}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(s.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {s.dataFine && ` → ${new Date(s.dataFine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.note && <MessageSquare className={`h-4 w-4 ${isCompleted ? 'text-emerald-500' : 'text-indigo-500'}`} />}
                      {!isCompleted && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300">In corso</span>}
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

  // === MAIN RETURN ===
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Operatività</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Pratiche</h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">Gestisci le pratiche di recupero crediti. Clicca su una pratica per vederne il dettaglio.</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition">
          <Plus className="h-4 w-4" />Nuova pratica
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{error}</div>}

      {/* CONTENT */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start transition-all duration-500 ease-in-out">
        {/* DETAIL PANEL */}
        <section
          className={`rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden transform transition-all duration-500 ease-in-out ${
            showDetail
              ? 'lg:basis-7/12 opacity-100 max-h-[2000px] translate-y-0 scale-100'
              : 'lg:basis-0 opacity-0 max-h-0 pointer-events-none -translate-y-2 scale-[0.98]'
          }`}
        >
          {selectedPratica && (
            <>
              {/* Detail Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50"><FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-50">{selectedPratica.cliente?.ragioneSociale}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">vs {getDebitoreDisplayName(selectedPratica.debitore)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!selectedPratica.aperta && selectedPratica.attivo && <button onClick={handleRiapri} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/50"><RotateCcw className="h-3.5 w-3.5" />Riapri</button>}
                  {selectedPratica.attivo ? <button onClick={handleDeactivate} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Disattiva"><PowerOff className="h-4 w-4" /></button> : <button onClick={handleReactivatePratica} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Riattiva"><Power className="h-4 w-4" /></button>}
                  <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Elimina"><Trash2 className="h-4 w-4" /></button>
                  <button onClick={handleCloseDetail} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
                </div>
              </div>

              {!selectedPratica.attivo && <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="h-4 w-4" />Pratica disattivata</div>}

              {/* Progress Stepper */}
              <div className="border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                {renderProgressStepper()}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {([{ id: 'overview', label: 'Panoramica', icon: FileEdit }, { id: 'financials', label: 'Importi', icon: Banknote }, { id: 'timeline', label: 'Timeline', icon: History }] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === id ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-[500px] overflow-auto">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'financials' && renderFinancialsTab()}
                {activeTab === 'timeline' && renderTimelineTab()}
              </div>

              {/* Editing Footer */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <button onClick={handleCancelEditing} disabled={savingEdit} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700">Annulla</button>
                  <button onClick={submitEditForm} disabled={savingEdit} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Save className="h-4 w-4" />{savingEdit ? 'Salvataggio...' : 'Salva'}</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* PRATICHE LIST */}
        <section
          className={`rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden transform transition-all duration-500 ease-in-out ${
            showDetail
              ? 'lg:basis-5/12 translate-y-0'
              : 'lg:basis-full translate-y-0'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Lista pratiche</h2>
              <button onClick={refreshPratiche} disabled={loadingPratiche} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><RefreshCw className={`h-4 w-4 ${loadingPratiche ? 'animate-spin' : ''}`} /></button>
            </div>
            <div className="space-y-2">
              <SearchableClienteSelect clienti={clienti} loading={loadingClienti} value={filterClienteId} onChange={handleFilterByCliente} placeholder="Filtra per cliente..." allowClear className="text-xs" />
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="flex items-center gap-1">{showInactive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}Mostra disattivate</span>
              </label>
            </div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {loadingPratiche ? (
              <div className="flex items-center justify-center py-12 text-slate-500"><RefreshCw className="h-5 w-5 animate-spin mr-2" /><span className="text-xs">Caricamento...</span></div>
            ) : pratiche.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-40" /><p className="text-xs">Nessuna pratica</p></div>
            ) : (
              <div className="p-2 space-y-1">
                {pratiche.map(pratica => {
                  const fase = getFaseById(pratica.faseId);
                  const isSelected = selectedPratica?.id === pratica.id;
                  return (
                    <button key={pratica.id} onClick={() => handleSelectPratica(pratica.id)} className={`w-full text-left p-3 rounded-xl transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40 ring-1 ring-indigo-300 dark:ring-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${!pratica.attivo ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: fase?.colore || '#6B7280' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{pratica.cliente?.ragioneSociale}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">vs {getDebitoreDisplayName(pratica.debitore)}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: `${fase?.colore}15`, color: fase?.colore }}>{fase?.nome || 'N/D'}</span>
                            <span className="text-[10px] font-medium text-slate-500">€ {formatCurrency(pratica.capitale)}</span>
                          </div>
                        </div>
                        {!pratica.aperta && <div className={`p-1.5 rounded-full ${pratica.esito === 'positivo' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'}`}>{pratica.esito === 'positivo' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODALS */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { resetNewForm(); setShowNewForm(false); setNoteNuovaPratica(''); }} />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"><h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuova pratica</h2><button onClick={() => { resetNewForm(); setShowNewForm(false); setNoteNuovaPratica(''); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="h-5 w-5" /></button></div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente *</label><SearchableClienteSelect clienti={clienti} loading={loadingClienti} value={newForm.clienteId || null} onChange={id => updateNewForm('clienteId', id || '')} placeholder="Seleziona cliente..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Debitore *</label><CustomSelect options={debitoreOptions} value={newForm.debitoreId} onChange={id => updateNewForm('debitoreId', id)} placeholder={!newForm.clienteId ? 'Prima seleziona cliente' : 'Seleziona debitore...'} disabled={!newForm.clienteId} loading={loadingDebitori} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capitale</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span><input type="text" inputMode="decimal" value={capitaleInput} onChange={e => setCapitaleInput(e.target.value)} onFocus={() => setCapitaleInput(newForm.capitale ? newForm.capitale.toString().replace('.', ',') : '')} onBlur={e => { const n = formatoItalianoANumero(e.target.value); updateNewForm('capitale', n); setCapitaleInput(numeroAFormatoItaliano(n)); }} className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" placeholder="0,00" /></div></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data affidamento</label><input type="date" value={newForm.dataAffidamento || ''} onChange={e => updateNewForm('dataAffidamento', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note iniziali</label><textarea value={noteNuovaPratica} onChange={e => setNoteNuovaPratica(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" placeholder="Note per la fase iniziale..." /></div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => { resetNewForm(); setCapitaleInput(''); setNoteNuovaPratica(''); setShowNewForm(false); }} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700">Annulla</button>
              <button onClick={handleCreatePratica} disabled={savingNew || !newForm.clienteId || !newForm.debitoreId} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Plus className="h-4 w-4" />{savingNew ? 'Creazione...' : 'Crea'}</button>
            </div>
          </div>
        </div>
      )}

      {showCambioFase && selectedPratica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseCambioFase} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"><h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Avanza fase</h2><button onClick={handleCloseCambioFase} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="h-5 w-5" /></button></div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prossima fase *</label><CustomSelect options={faseOptions} value={cambioFaseData.nuovaFaseId} onChange={id => updateCambioFaseData('nuovaFaseId', id)} placeholder="Seleziona fase..." />{fasiAvanzamento.length === 0 && <p className="mt-2 text-xs text-amber-600">Nessuna fase successiva disponibile.</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note chiusura fase</label><textarea value={cambioFaseData.note} onChange={e => updateCambioFaseData('note', e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" placeholder="Note..." /></div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={handleCloseCambioFase} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700">Annulla</button>
              <button onClick={handleCambiaFaseWithConfirm} disabled={savingCambioFase || !cambioFaseData.nuovaFaseId} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"><ArrowRight className="h-4 w-4" />{savingCambioFase ? 'Cambio...' : 'Avanza'}</button>
            </div>
          </div>
        </div>
      )}

      {selectedStoricoFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStoricoFase(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full ${selectedStoricoFase.dataFine ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'}`}>
                  {selectedStoricoFase.dataFine ? <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedStoricoFase.faseNome}</h2>
                  <p className="text-xs text-slate-500">{selectedStoricoFase.dataFine ? 'Fase completata' : 'Fase in corso'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStoricoFase(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800"><p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Inizio</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(selectedStoricoFase.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
                <div className={`p-3 rounded-xl ${selectedStoricoFase.dataFine ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}><p className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${selectedStoricoFase.dataFine ? 'text-emerald-600' : 'text-indigo-600'}`}>{selectedStoricoFase.dataFine ? 'Fine' : 'Stato'}</p><p className={`text-sm font-semibold ${selectedStoricoFase.dataFine ? 'text-emerald-700 dark:text-emerald-300' : 'text-indigo-700 dark:text-indigo-300'}`}>{selectedStoricoFase.dataFine ? new Date(selectedStoricoFase.dataFine).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : 'In corso'}</p></div>
              </div>
              <div><p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">Note</p>{selectedStoricoFase.note ? <div className={`p-3 rounded-xl border-l-4 ${selectedStoricoFase.dataFine ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'}`}><p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedStoricoFase.note}</p></div> : <p className="text-sm text-slate-400 italic">Nessuna nota</p>}</div>
            </div>
            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700"><button onClick={() => setSelectedStoricoFase(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700">Chiudi</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}