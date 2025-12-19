// apps/frontend/src/pages/AvvocatiPage.tsx
import { useState, useEffect } from 'react';
import {
  User, Plus, X, Save, Eye, EyeOff, Power, PowerOff, Trash2, Edit, Mail, Phone, FileText, Shield, RefreshCw
} from 'lucide-react';
import { avvocatiApi, type Avvocato, type CreateAvvocatoDto, type LivelloAccessoPratiche, type LivelloPermessi, getAvvocatoDisplayName } from '../api/avvocati';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Pagination } from '../components/Pagination';

export function AvvocatiPage() {
  const [avvocati, setAvvocati] = useState<Avvocato[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedAvvocato, setSelectedAvvocato] = useState<Avvocato | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Form states
  const [formData, setFormData] = useState<CreateAvvocatoDto>({
    nome: '',
    cognome: '',
    email: '',
    codiceFiscale: '',
    telefono: '',
    livelloAccessoPratiche: 'solo_proprie',
    livelloPermessi: 'modifica',
    note: '',
  });

  const loadAvvocati = async () => {
    try {
      setLoading(true);
      console.log('📋 AvvocatiPage: Caricamento avvocati, showInactive:', showInactive);
      const data = await avvocatiApi.getAll(showInactive);
      console.log('📋 AvvocatiPage: Avvocati ricevuti:', data);
      setAvvocati(data);
      setError(null);
    } catch (err: any) {
      console.error('📋 AvvocatiPage: Errore caricamento:', err);
      setError(err.message || 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvvocati();
  }, [showInactive]);

  const resetForm = () => {
    setFormData({
      nome: '',
      cognome: '',
      email: '',
      codiceFiscale: '',
      telefono: '',
      livelloAccessoPratiche: 'solo_proprie',
      livelloPermessi: 'modifica',
      note: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.nome || !formData.cognome || !formData.email) {
      alert('Nome, cognome ed email sono obbligatori');
      return;
    }

    if (await confirm({
      title: 'Conferma creazione',
      message: `Creare avvocato ${formData.nome} ${formData.cognome}?`,
      confirmText: 'Crea',
      variant: 'info',
    })) {
      try {
        setSaving(true);
        await avvocatiApi.create(formData);
        await loadAvvocati();
        setShowNewForm(false);
        resetForm();
      } catch (err: any) {
        alert(err.message || 'Errore nella creazione');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedAvvocato) return;

    if (await confirm({
      title: 'Conferma modifica',
      message: `Salvare le modifiche per ${getAvvocatoDisplayName(selectedAvvocato)}?`,
      confirmText: 'Salva',
      variant: 'info',
    })) {
      try {
        setSaving(true);
        await avvocatiApi.update(selectedAvvocato.id, formData);
        await loadAvvocati();
        setIsEditing(false);
        setIsViewing(true);
        const updatedAvvocato = await avvocatiApi.getAll(showInactive).then(data =>
          data.find(a => a.id === selectedAvvocato.id)
        );
        if (updatedAvvocato) {
          setSelectedAvvocato(updatedAvvocato);
          setFormData({
            nome: updatedAvvocato.nome,
            cognome: updatedAvvocato.cognome,
            email: updatedAvvocato.email,
            codiceFiscale: updatedAvvocato.codiceFiscale || '',
            telefono: updatedAvvocato.telefono || '',
            livelloAccessoPratiche: updatedAvvocato.livelloAccessoPratiche,
            livelloPermessi: updatedAvvocato.livelloPermessi,
            note: updatedAvvocato.note || '',
          });
        }
      } catch (err: any) {
        alert(err.message || 'Errore nell\'aggiornamento');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeactivate = async (avvocato: Avvocato) => {
    if (await confirm({
      title: 'Disattiva avvocato',
      message: `Disattivare ${getAvvocatoDisplayName(avvocato)}?`,
      confirmText: 'Disattiva',
      variant: 'warning',
    })) {
      try {
        await avvocatiApi.deactivate(avvocato.id);
        await loadAvvocati();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleReactivate = async (avvocato: Avvocato) => {
    try {
      await avvocatiApi.reactivate(avvocato.id);
      await loadAvvocati();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (avvocato: Avvocato) => {
    if (await confirm({
      title: 'Elimina avvocato',
      message: `Eliminare definitivamente ${getAvvocatoDisplayName(avvocato)}?\nQuesta operazione è irreversibile e fallirà se l'avvocato è associato a pratiche.`,
      confirmText: 'Elimina',
      variant: 'danger',
    })) {
      try {
        await avvocatiApi.delete(avvocato.id);
        await loadAvvocati();
      } catch (err: any) {
        alert(err.message || 'Impossibile eliminare: avvocato associato a pratiche');
      }
    }
  };

  const handleRowClick = (avvocato: Avvocato) => {
    setSelectedAvvocato(avvocato);
    setFormData({
      nome: avvocato.nome,
      cognome: avvocato.cognome,
      email: avvocato.email,
      codiceFiscale: avvocato.codiceFiscale || '',
      telefono: avvocato.telefono || '',
      livelloAccessoPratiche: avvocato.livelloAccessoPratiche,
      livelloPermessi: avvocato.livelloPermessi,
      note: avvocato.note || '',
    });
    setIsViewing(true);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsViewing(false);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (selectedAvvocato) {
      setFormData({
        nome: selectedAvvocato.nome,
        cognome: selectedAvvocato.cognome,
        email: selectedAvvocato.email,
        codiceFiscale: selectedAvvocato.codiceFiscale || '',
        telefono: selectedAvvocato.telefono || '',
        livelloAccessoPratiche: selectedAvvocato.livelloAccessoPratiche,
        livelloPermessi: selectedAvvocato.livelloPermessi,
        note: selectedAvvocato.note || '',
      });
      setIsViewing(true);
      setIsEditing(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAvvocato(null);
    setIsViewing(false);
    setIsEditing(false);
    resetForm();
  };

  const livelloAccessoOptions = [
    { value: 'solo_proprie', label: 'Solo proprie pratiche' },
    { value: 'tutte', label: 'Tutte le pratiche' },
  ];

  const livelloPermessiOptions = [
    { value: 'visualizzazione', label: 'Solo visualizzazione' },
    { value: 'modifica', label: 'Visualizzazione e modifica' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Studio</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Avvocati</h1>
          <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Gestisci gli avvocati dello studio. Configura i permessi di accesso alle pratiche.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          Nuovo Avvocato
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* FILTRI */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="flex items-center gap-1">
            {showInactive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Mostra disattivati
          </span>
        </label>
        <button
          onClick={loadAvvocati}
          disabled={loading}
          className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* LISTA AVVOCATI */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            <span className="text-xs">Caricamento...</span>
          </div>
        ) : !avvocati || avvocati.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <User className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Nessun avvocato</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Avvocato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Contatti</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Accesso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Permessi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {avvocati
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((avvocato) => (
                  <tr
                    key={avvocato.id}
                    onClick={() => handleRowClick(avvocato)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${!avvocato.attivo ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {getAvvocatoDisplayName(avvocato)}
                        </p>
                        {avvocato.codiceFiscale && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{avvocato.codiceFiscale}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Mail className="h-3 w-3" />
                          {avvocato.email}
                        </div>
                        {avvocato.telefono && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <Phone className="h-3 w-3" />
                            {avvocato.telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                        <Shield className="h-3 w-3" />
                        {avvocato.livelloAccessoPratiche === 'tutte' ? 'Tutte' : 'Solo proprie'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        avvocato.livelloPermessi === 'modifica'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      }`}>
                        <FileText className="h-3 w-3" />
                        {avvocato.livelloPermessi === 'modifica' ? 'Modifica' : 'Solo lettura'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {avvocato.attivo ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivate(avvocato);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Disattiva"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReactivate(avvocato);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Riattiva"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(avvocato);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(avvocati.length / ITEMS_PER_PAGE)}
              totalItems={avvocati.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL NUOVO/MODIFICA/VISUALIZZA */}
      {(showNewForm || isEditing || isViewing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (isViewing) {
                handleCloseDetail();
              } else {
                setShowNewForm(false);
                setIsEditing(false);
                resetForm();
              }
            }}
          />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {isViewing ? 'Dettaglio Avvocato' : isEditing ? 'Modifica Avvocato' : 'Nuovo Avvocato'}
              </h2>
              <div className="flex items-center gap-2">
                {isViewing && (
                  <button
                    onClick={handleStartEditing}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Modifica"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
                {isEditing && selectedAvvocato && (
                  <button
                    onClick={handleCancelEditing}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                  >
                    Annulla
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isViewing) {
                      handleCloseDetail();
                    } else {
                      setShowNewForm(false);
                      setIsEditing(false);
                      resetForm();
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    disabled={isViewing}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Mario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    disabled={isViewing}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isViewing}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="mario.rossi@studio.it"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                    disabled={isViewing}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="RSSMRA80A01H501Z"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    disabled={isViewing}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="+39 333 1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Livello Accesso Pratiche
                </label>
                <CustomSelect
                  options={livelloAccessoOptions}
                  value={formData.livelloAccessoPratiche || 'solo_proprie'}
                  onChange={(value) => setFormData({ ...formData, livelloAccessoPratiche: value as LivelloAccessoPratiche })}
                  placeholder="Seleziona livello accesso"
                  disabled={isViewing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Livello Permessi
                </label>
                <CustomSelect
                  options={livelloPermessiOptions}
                  value={formData.livelloPermessi || 'modifica'}
                  onChange={(value) => setFormData({ ...formData, livelloPermessi: value as LivelloPermessi })}
                  placeholder="Seleziona livello permessi"
                  disabled={isViewing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  disabled={isViewing}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Note aggiuntive..."
                />
              </div>
            </div>

            {!isViewing && (
              <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowNewForm(false);
                    setIsEditing(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  onClick={isEditing ? handleUpdate : handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Avvocato'}
                </button>
              </div>
            )}
            {isViewing && (
              <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleCloseDetail}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700"
                >
                  Chiudi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}
