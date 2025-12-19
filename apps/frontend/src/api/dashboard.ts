// apps/frontend/src/api/dashboard.ts
import { api } from './config';

export interface DashboardStats {
  numeroPratiche: number;
  praticheAperte: number;
  praticheChiuse: number;
  praticheChiusePositive: number;
  praticheChiuseNegative: number;

  capitaleAffidato: number;
  interessiAffidati: number;
  anticipazioniAffidate: number;
  compensiAffidati: number;

  capitaleRecuperato: number;
  interessiRecuperati: number;
  anticipazioniRecuperate: number;
  compensiRecuperati: number;

  percentualeRecuperoCapitale: number;
  percentualeRecuperoInteressi: number;
  percentualeRecuperoAnticipazioni: number;
  percentualeRecuperoCompensi: number;
}

export interface KPI {
  totalePraticheAffidate: number;
  totalePraticheChiuse: number;
  percentualeChiusura: number;

  esitoNegativo: number;
  esitoPositivo: number;
  esitoPositivoParziale: number;
  esitoPositivoTotale: number;

  recuperoCapitale: {
    totale: number;
    parziale: number;
    completo: number;
  };

  recuperoInteressi: {
    totale: number;
    parziale: number;
    completo: number;
  };

  recuperoCompensi: {
    totale: number;
    parziale: number;
    completo: number;
  };
}

export const dashboardApi = {
  async getStats(clienteId?: string): Promise<DashboardStats> {
    const params = clienteId ? { clienteId } : {};
    return await api.get('/dashboard/stats', params);
  },

  async getKPI(clienteId?: string): Promise<KPI> {
    const params = clienteId ? { clienteId } : {};
    return await api.get('/dashboard/kpi', params);
  },
};

export async function fetchDashboardStats(clienteId?: string): Promise<DashboardStats> {
  return dashboardApi.getStats(clienteId);
}

export async function fetchDashboardKPI(clienteId?: string): Promise<KPI> {
  return dashboardApi.getKPI(clienteId);
}

export interface DashboardCondivisa {
  cliente: {
    id: string;
    ragioneSociale: string;
  };
  configurazione: {
    abilitata: boolean;
    dashboard: {
      stats: boolean;
      kpi: boolean;
    };
    pratiche: {
      elenco: boolean;
      dettagli: boolean;
      documenti: boolean;
      movimentiFinanziari: boolean;
      timeline: boolean;
    };
  };
  stats?: DashboardStats;
  kpi?: KPI;
}

export async function fetchDashboardCondivisa(clienteId: string): Promise<DashboardCondivisa> {
  return await api.get(`/dashboard/condivisa/${clienteId}`);
}
