// apps/frontend/src/pages/PratichePage.tsx
import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  X,
  Save,
  ChevronRight,
  RefreshCw,
  Power,
  PowerOff,
  Trash2,
  ArrowRight,
  RotateCcw,
  Building2,
  User,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { usePratichePage } from '../features/pratiche/usePratichePage';
import {
  formatCurrency,
  getDebitoreDisplayName,
  getEsitoLabel,
  getFaseNome,
  getFaseColore,
  type StoricoFase,
} from '../api/pratiche';
import { SearchableClienteSelect } from '../components/ui/SearchableClienteSelect';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

// === Helper per formattazione valuta italiana ===
const formatoItalianoANumero = (valore: string): number => {
  if (!valore) return 0;
  // Rimuovi punti separatori migliaia, sostituisci virgola con punto
  const stringa = String(valore).replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(stringa);
  return isNaN(numero) ? 0 : numero;
};

const numeroAFormatoItaliano = (valore: number | string | undefined): string => {
  if (valore === undefined || valore === null || valore === '' || valore === 0) return '';
  const numero = typeof valore === 'string' ? parseFloat(valore) : valore;
  if (isNaN(numero) || numero === 0) return '';
  return numero.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function PratichePage() {
  const {
    pratiche,
    loadingPratiche,
    fasi,
    loadingFasi,
    clienti,
    loadingClienti,
    debitoriForCliente,
    loadingDebitori,
    error,
    filterClienteId,
    showInactive,
    setShowInactive,
    handleFilterByCliente,
    selectedPratica,
    handleSelectPratica,
    handleCloseDetail,
    showNewForm,
    setShowNewForm,
    newForm,
    updateNewForm,
    resetNewForm,
    submitNewPratica,
    savingNew,
    isEditing,
    editForm,
    updateEditForm,
    handleStartEditing,
    handleCancelEditing,
    submitEditForm,
    savingEdit,
    showCambioFase,
    cambioFaseData,
    fasiDisponibili,
    handleOpenCambioFase,
    handleCloseCambioFase,
    updateCambioFaseData,
    submitCambioFase,
    savingCambioFase,
    handleRiapriPratica,
    handleDeactivatePratica,
    handleReactivatePratica,
    handleDeletePratica,
    getFaseById,
    refreshPratiche,
  } = usePratichePage();

  const { confirm, ConfirmDialog } = useConfirmDialog();

  // === Stato per input valuta formattati ===
  const [capitaleInput, setCapitaleInput] = useState('');
  
  // === Stato per feedback visivo cambio fase ===
  const [showFaseSuccessFeedback, setShowFaseSuccessFeedback] = useState(false);
  
  // === Stato per modale dettaglio fase storico ===
  const [selectedStoricoFase, setSelectedStoricoFase] = useState<StoricoFase | null>(null);

  // === Effetto per reset feedback dopo timeout ===
  useEffect(() => {
    if (showFaseSuccessFeedback) {
      const timer = setTimeout(() => setShowFaseSuccessFeedback(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showFaseSuccessFeedback]);

  // === Handlers con conferma ===

  const handleDeactivate = async () => {
    const confirmed = await confirm({
      title: 'Disattiva pratica',
      message: 'Sei sicuro di voler disattivare questa pratica? Potrà essere riattivata in seguito.',
      confirmText: 'Disattiva',
      variant: 'warning',
    });
    if (confirmed) {
      await handleDeactivatePratica();
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Elimina pratica',
      message: 'Sei sicuro di voler eliminare definitivamente questa pratica? Questa azione non può essere annullata.',
      confirmText: 'Elimina',
      variant: 'danger',
    });
    if (confirmed) {
      await handleDeletePratica();
    }
  };

  const handleRiapri = async () => {
    const confirmed = await confirm({
      title: 'Riapri pratica',
      message: 'Vuoi riaprire questa pratica? Tornerà alla prima fase del processo.',
      confirmText: 'Riapri',
      variant: 'info',
    });
    if (confirmed) {
      await handleRiapriPratica();
    }
  };

  // Handler per creazione pratica con conferma
  const handleCreatePratica = async () => {
    // Trova cliente e debitore per mostrare i nomi nella conferma
    const cliente = clienti.find(c => c.id === newForm.clienteId);
    const debitore = debitoriForCliente.find(d => d.id === newForm.debitoreId);
    
    const clienteNome = cliente?.ragioneSociale || 'Cliente';
    const debitoreNome = debitore?.tipoSoggetto === 'persona_fisica'
      ? `${debitore.nome} ${debitore.cognome}`.trim()
      : debitore?.ragioneSociale || 'Debitore';
    
    const capitaleStr = newForm.capitale 
      ? `€ ${newForm.capitale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
      : 'non specificato';

    const confirmed = await confirm({
      title: 'Conferma apertura pratica',
      message: `Stai per aprire una nuova pratica:\n\n• Cliente: ${clienteNome}\n• Debitore: ${debitoreNome}\n• Capitale: ${capitaleStr}\n\nConfermi l'apertura?`,
      confirmText: 'Apri pratica',
      variant: 'info',
    });
    
    if (confirmed) {
      await submitNewPratica();
      setCapitaleInput('');
    }
  };

  // Handler per cambio fase con feedback visivo
  const handleCambiaFaseWithFeedback = async () => {
    await submitCambioFase();
    setShowFaseSuccessFeedback(true);
  };

  // Filtra fasi disponibili: solo quelle con ordine > fase corrente (no ritorno indietro)
  const fasiAvanzamento = selectedPratica
    ? fasiDisponibili.filter((f) => {
        const faseCorrente = getFaseById(selectedPratica.faseId);
        if (!faseCorrente) return true;
        return f.ordine > faseCorrente.ordine;
      })
    : fasiDisponibili;

  // Opzioni per CustomSelect debitore
  const debitoreOptions = debitoriForCliente.map((d) => ({
    value: d.id,
    label: d.tipoSoggetto === 'persona_fisica'
      ? `${d.nome} ${d.cognome}`.trim()
      : d.ragioneSociale || '',
    sublabel: d.tipoSoggetto === 'persona_fisica' 
      ? d.codiceFiscale || undefined
      : d.partitaIva || undefined,
  }));

  // Opzioni per CustomSelect fase
  const faseOptions = fasiAvanzamento.map((f) => ({
    value: f.id,
    label: f.nome,
    sublabel: f.isFaseChiusura ? 'Fase di chiusura' : undefined,
  }));

  // === Render lista pratiche ===

  const renderPraticheList = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Pratiche
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPratiche}
            disabled={loadingPratiche}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            title="Aggiorna"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPratiche ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Nuova pratica
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <SearchableClienteSelect
              clienti={clienti}
              loading={loadingClienti}
              value={filterClienteId}
              onChange={handleFilterByCliente}
              placeholder="Filtra per cliente..."
              allowClear
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <span className="flex items-center gap-1">
              {showInactive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Mostra disattivate
            </span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-auto p-4">
        {loadingPratiche ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Caricamento...
          </div>
        ) : pratiche.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nessuna pratica trovata</p>
            <p className="text-sm mt-1">
              {filterClienteId
                ? 'Prova a rimuovere il filtro cliente'
                : 'Clicca su "Nuova pratica" per iniziare'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pratiche.map((pratica) => {
              const fase = getFaseById(pratica.faseId);
              return (
                <div
                  key={pratica.id}
                  onClick={() => handleSelectPratica(pratica.id)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                    ${selectedPratica?.id === pratica.id
                      ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                    }
                    ${!pratica.attivo ? 'opacity-60' : ''}
                  `}
                >
                  {/* Indicatore stato */}
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: fase?.colore || '#6B7280' }}
                  />

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {pratica.cliente?.ragioneSociale || 'Cliente N/D'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 truncate">
                        {getDebitoreDisplayName(pratica.debitore)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: fase?.colore || '#6B7280' }}
                      >
                        {fase?.nome || 'N/D'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {formatCurrency(pratica.capitale)}
                      </span>
                      {pratica.dataAffidamento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(pratica.dataAffidamento).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge stato */}
                  <div className="flex-shrink-0">
                    {!pratica.attivo ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        Disattivata
                      </span>
                    ) : pratica.aperta ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                        Aperta
                      </span>
                    ) : pratica.esito === 'positivo' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                        Chiusa +
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                        Chiusa -
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // === Render dettaglio pratica ===

  const renderPraticaDetail = () => {
    if (!selectedPratica) return null;

    const fase = getFaseById(selectedPratica.faseId);

    return (
      <div className="flex-1 overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-700">
        {/* Header dettaglio */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-10 rounded-full"
              style={{ backgroundColor: fase?.colore || '#6B7280' }}
            />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                {selectedPratica.cliente?.ragioneSociale}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                vs {getDebitoreDisplayName(selectedPratica.debitore)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && selectedPratica.attivo && (
              <button
                onClick={handleStartEditing}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30"
                title="Modifica"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleCloseDetail}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Badge disattivato */}
          {!selectedPratica.attivo && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Questa pratica è disattivata
            </div>
          )}

          {/* Stato e fase */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Fase corrente
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: fase?.colore || '#6B7280' }}
                >
                  {fase?.nome || 'N/D'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Stato
                </p>
                {selectedPratica.aperta ? (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    <Clock className="h-4 w-4" />
                    In corso
                  </span>
                ) : selectedPratica.esito === 'positivo' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Chiusa positiva
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <XCircle className="h-4 w-4" />
                    Chiusa negativa
                  </span>
                )}
              </div>
            </div>

            {/* Bottoni azioni fase */}
            {selectedPratica.attivo && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {selectedPratica.aperta ? (
                  <button
                    onClick={handleOpenCambioFase}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Cambia fase
                  </button>
                ) : (
                  <button
                    onClick={handleRiapri}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Riapri pratica
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Importi */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Importi
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {renderImportoField('Capitale', 'capitale', editForm.capitale)}
              {renderImportoField('Recuperato capitale', 'importoRecuperatoCapitale', editForm.importoRecuperatoCapitale)}
              {renderImportoField('Anticipazioni', 'anticipazioni', editForm.anticipazioni)}
              {renderImportoField('Recuperato anticipazioni', 'importoRecuperatoAnticipazioni', editForm.importoRecuperatoAnticipazioni)}
              {renderImportoField('Compensi legali', 'compensiLegali', editForm.compensiLegali)}
              {renderImportoField('Compensi liquidati', 'compensiLiquidati', editForm.compensiLiquidati)}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Date
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {renderDateField('Data affidamento', 'dataAffidamento', editForm.dataAffidamento)}
              {renderDateField('Data scadenza', 'dataScadenza', editForm.dataScadenza)}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Note
            </h3>
            {isEditing ? (
              <textarea
                value={editForm.note || ''}
                onChange={(e) => updateEditForm('note', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Aggiungi note..."
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {selectedPratica.note || '(Nessuna nota)'}
              </p>
            )}
          </div>

          {/* Storico fasi */}
          {selectedPratica.storico && selectedPratica.storico.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Storico fasi
              </h3>
              <div className="space-y-2">
                {selectedPratica.storico.map((s, idx) => {
                  const isCompleted = !!s.dataFine;
                  const isLastCompleted = isCompleted && idx === selectedPratica.storico!.length - 2 && showFaseSuccessFeedback;
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => isCompleted && setSelectedStoricoFase(s)}
                      disabled={!isCompleted}
                      className={`flex items-start gap-3 p-3 rounded-lg w-full text-left transition-all ${
                        isCompleted 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                          : 'bg-slate-50 dark:bg-slate-800/50'
                      } ${
                        isLastCompleted 
                          ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' 
                          : isCompleted 
                          ? 'border border-emerald-300 dark:border-emerald-700' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getFaseById(s.faseId)?.colore || '#6B7280',
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-50'}`}>
                            {s.faseNome}
                          </p>
                          {isCompleted && s.note && (
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(s.dataInizio).toLocaleDateString('it-IT')}{' '}
                          {s.dataFine && `→ ${new Date(s.dataFine).toLocaleDateString('it-IT')}`}
                        </p>
                      </div>
                      {isCompleted && (
                        <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer azioni */}
        {isEditing ? (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCancelEditing}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Annulla
            </button>
            <button
              onClick={submitEditForm}
              disabled={savingEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Save className="h-4 w-4" />
              {savingEdit ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              {selectedPratica.attivo ? (
                <button
                  onClick={handleDeactivate}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg dark:text-amber-400 dark:hover:bg-amber-900/30"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Disattiva
                </button>
              ) : (
                <button
                  onClick={handleReactivatePratica}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                >
                  <Power className="h-3.5 w-3.5" />
                  Riattiva
                </button>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg dark:text-rose-400 dark:hover:bg-rose-900/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Elimina
            </button>
          </div>
        )}
      </div>
    );
  };

  // === Helper render field ===

  const renderImportoField = (
    label: string,
    field: keyof typeof editForm,
    value: any
  ) => (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {isEditing ? (
        <input
          type="number"
          step="0.01"
          value={value || 0}
          onChange={(e) => updateEditForm(field, parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      ) : (
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );

  const renderDateField = (
    label: string,
    field: keyof typeof editForm,
    value: any
  ) => (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {isEditing ? (
        <input
          type="date"
          value={value ? value.split('T')[0] : ''}
          onChange={(e) => updateEditForm(field, e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      ) : (
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {value ? new Date(value).toLocaleDateString('it-IT') : '-'}
        </p>
      )}
    </div>
  );

  // === Modale nuova pratica ===

  const renderNewPraticaModal = () => {
    if (!showNewForm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            resetNewForm();
            setShowNewForm(false);
          }}
        />
        <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Nuova pratica
            </h2>
            <button
              onClick={() => {
                resetNewForm();
                setShowNewForm(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cliente *
              </label>
              <SearchableClienteSelect
                clienti={clienti}
                loading={loadingClienti}
                value={newForm.clienteId || null}
                onChange={(id) => updateNewForm('clienteId', id || '')}
                placeholder="Seleziona cliente..."
              />
            </div>

            {/* Debitore */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Debitore *
              </label>
              <CustomSelect
                options={debitoreOptions}
                value={newForm.debitoreId}
                onChange={(id) => updateNewForm('debitoreId', id)}
                placeholder={
                  !newForm.clienteId
                    ? 'Prima seleziona un cliente'
                    : debitoriForCliente.length === 0
                    ? 'Nessun debitore per questo cliente'
                    : 'Seleziona debitore...'
                }
                disabled={!newForm.clienteId}
                loading={loadingDebitori}
              />
            </div>

            {/* Capitale */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Capitale da recuperare
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={capitaleInput}
                  onChange={(e) => setCapitaleInput(e.target.value)}
                  onFocus={() => {
                    // Quando entro, mostro il valore numerico pulito per editing
                    if (newForm.capitale && newForm.capitale > 0) {
                      setCapitaleInput(newForm.capitale.toString().replace('.', ','));
                    } else {
                      setCapitaleInput('');
                    }
                  }}
                  onBlur={(e) => {
                    // Quando esco, converto in numero e formatto
                    const numero = formatoItalianoANumero(e.target.value);
                    updateNewForm('capitale', numero);
                    setCapitaleInput(numeroAFormatoItaliano(numero));
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Data affidamento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data affidamento
              </label>
              <input
                type="date"
                value={newForm.dataAffidamento || ''}
                onChange={(e) => updateNewForm('dataAffidamento', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Note
              </label>
              <textarea
                value={newForm.note || ''}
                onChange={(e) => updateNewForm('note', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Note opzionali..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                resetNewForm();
                setCapitaleInput('');
                setShowNewForm(false);
              }}
              disabled={savingNew}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Annulla
            </button>
            <button
              onClick={handleCreatePratica}
              disabled={savingNew || !newForm.clienteId || !newForm.debitoreId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus className="h-4 w-4" />
              {savingNew ? 'Creazione...' : 'Crea pratica'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // === Modale cambio fase ===

  const renderCambioFaseModal = () => {
    if (!showCambioFase || !selectedPratica) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseCambioFase}
        />
        <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Cambia fase
            </h2>
            <button
              onClick={handleCloseCambioFase}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nuova fase *
              </label>
              <CustomSelect
                options={faseOptions}
                value={cambioFaseData.nuovaFaseId}
                onChange={(id) => updateCambioFaseData('nuovaFaseId', id)}
                placeholder="Seleziona fase..."
              />
              {fasiAvanzamento.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Non ci sono fasi successive disponibili. La pratica è già all'ultima fase.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Note (opzionale)
              </label>
              <textarea
                value={cambioFaseData.note}
                onChange={(e) => updateCambioFaseData('note', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Note sul cambio fase..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCloseCambioFase}
              disabled={savingCambioFase}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Annulla
            </button>
            <button
              onClick={handleCambiaFaseWithFeedback}
              disabled={savingCambioFase || !cambioFaseData.nuovaFaseId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <ArrowRight className="h-4 w-4" />
              {savingCambioFase ? 'Cambio...' : 'Cambia fase'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // === Render principale ===

  return (
    <div className="flex h-full">
      {/* Lista pratiche */}
      <div className={`${selectedPratica ? 'w-1/2' : 'w-full'} flex flex-col`}>
        {renderPraticheList()}
      </div>

      {/* Dettaglio pratica */}
      {selectedPratica && (
        <div className="w-1/2 flex flex-col">
          {renderPraticaDetail()}
        </div>
      )}

      {/* Modali */}
      {renderNewPraticaModal()}
      {renderCambioFaseModal()}
      
      {/* Modale dettaglio fase completata */}
      {selectedStoricoFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedStoricoFase(null)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {selectedStoricoFase.faseNome}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fase completata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStoricoFase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data inizio</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {new Date(selectedStoricoFase.dataInizio).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {selectedStoricoFase.dataFine && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Data fine</p>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {new Date(selectedStoricoFase.dataFine).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Note di chiusura fase
                </p>
                {selectedStoricoFase.note ? (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border-l-4 border-emerald-500">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedStoricoFase.note}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                    Nessuna nota inserita per questa fase
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedStoricoFase(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
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