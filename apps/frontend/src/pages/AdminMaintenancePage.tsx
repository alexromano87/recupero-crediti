import { useEffect, useState } from 'react';
import { adminApi, type OrphanDataReport } from '../api/admin';
import { studiApi, type Studio } from '../api/studi';
import { AlertTriangle, CheckCircle, Database } from 'lucide-react';

export default function AdminMaintenancePage() {
  const [orphanData, setOrphanData] = useState<OrphanDataReport | null>(null);
  const [studi, setStudi] = useState<Studio[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orphanDataRes, studiRes] = await Promise.all([
        adminApi.getOrphanData(),
        studiApi.getAll(),
      ]);
      setOrphanData(orphanDataRes);
      setStudi(studiRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOrphanData = async () => {
    if (!selectedStudio) {
      setError('Seleziona uno studio');
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      setSuccess(null);

      const result = await adminApi.assignOrphanData(selectedStudio);
      setSuccess(`Dati assegnati con successo: ${JSON.stringify(result.updated)}`);

      // Ricarica i dati
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nell\'assegnazione dei dati');
    } finally {
      setAssigning(false);
    }
  };

  const getTotalOrphans = () => {
    if (!orphanData) return 0;
    return (
      orphanData.praticheSenzaStudio +
      orphanData.clientiSenzaStudio +
      orphanData.debitoriSenzaStudio +
      orphanData.avvocatiSenzaStudio +
      orphanData.movimentiFinanziariSenzaStudio +
      orphanData.alertsSenzaStudio +
      orphanData.ticketsSenzaStudio +
      orphanData.documentiSenzaStudio +
      orphanData.cartelleSenzaStudio +
      orphanData.utentiSenzaStudio
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  const totalOrphans = getTotalOrphans();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Manutenzione Dati</h1>
        <p className="text-gray-600">Gestione dati orfani e integrità del sistema</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dati Orfani (senza studio assegnato)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <span className="text-lg font-semibold">Totale Record Orfani</span>
            <span className={`text-2xl font-bold ${totalOrphans > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {totalOrphans}
            </span>
          </div>

          {orphanData && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Pratiche', value: orphanData.praticheSenzaStudio },
                { label: 'Clienti', value: orphanData.clientiSenzaStudio },
                { label: 'Debitori', value: orphanData.debitoriSenzaStudio },
                { label: 'Avvocati', value: orphanData.avvocatiSenzaStudio },
                { label: 'Movimenti Finanziari', value: orphanData.movimentiFinanziariSenzaStudio },
                { label: 'Alerts', value: orphanData.alertsSenzaStudio },
                { label: 'Tickets', value: orphanData.ticketsSenzaStudio },
                { label: 'Documenti', value: orphanData.documentiSenzaStudio },
                { label: 'Cartelle', value: orphanData.cartelleSenzaStudio },
                { label: 'Utenti', value: orphanData.utentiSenzaStudio },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-3 border rounded">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`font-bold ${item.value > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalOrphans > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Assegna Dati Orfani a uno Studio</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seleziona Studio</label>
              <select className="w-full p-2 border rounded" value={selectedStudio} onChange={(e) => setSelectedStudio(e.target.value)}>
                <option value="">-- Seleziona uno studio --</option>
                {studi.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.nome} {!studio.attivo && '(Inattivo)'}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleAssignOrphanData} disabled={!selectedStudio || assigning} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              {assigning ? 'Assegnazione in corso...' : 'Assegna Tutti i Dati Orfani'}
            </button>

            <p className="text-sm text-gray-600">
              Attenzione: questa operazione assegnerà TUTTI i record senza studio allo studio selezionato. L'operazione è irreversibile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
