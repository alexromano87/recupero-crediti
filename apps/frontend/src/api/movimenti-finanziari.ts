// apps/frontend/src/api/movimenti-finanziari.ts
import { api } from './config';

export type TipoMovimento =
  | 'capitale'
  | 'anticipazione'
  | 'compenso'
  | 'interessi'
  | 'recupero_capitale'
  | 'recupero_anticipazione'
  | 'recupero_compenso'
  | 'recupero_interessi';

export interface MovimentoFinanziario {
  id: string;
  praticaId: string;
  tipo: TipoMovimento;
  importo: number;
  data: string;
  oggetto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovimentoFinanziarioDto {
  praticaId: string;
  tipo: TipoMovimento;
  importo: number;
  data: string;
  oggetto?: string;
}

export interface UpdateMovimentoFinanziarioDto {
  tipo?: TipoMovimento;
  importo?: number;
  data?: string;
  oggetto?: string;
}

export interface TotaliMovimenti {
  capitale: number;
  anticipazioni: number;
  compensi: number;
  interessi: number;
  recuperoCapitale: number;
  recuperoAnticipazioni: number;
  recuperoCompensi: number;
  recuperoInteressi: number;
}

export const movimentiFinanziariApi = {
  async getAllByPratica(praticaId: string): Promise<MovimentoFinanziario[]> {
    return await api.get(`/movimenti-finanziari/pratica/${praticaId}`);
  },

  async getTotaliByPratica(praticaId: string): Promise<TotaliMovimenti> {
    return await api.get(`/movimenti-finanziari/pratica/${praticaId}/totali`);
  },

  async getById(id: string): Promise<MovimentoFinanziario> {
    return await api.get(`/movimenti-finanziari/${id}`);
  },

  async create(data: CreateMovimentoFinanziarioDto): Promise<MovimentoFinanziario> {
    return await api.post('/movimenti-finanziari', data);
  },

  async update(id: string, data: UpdateMovimentoFinanziarioDto): Promise<MovimentoFinanziario> {
    return await api.patch(`/movimenti-finanziari/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/movimenti-finanziari/${id}`);
  },
};

// Helper per ottenere etichetta tipo movimento
export function getTipoMovimentoLabel(tipo: TipoMovimento): string {
  const labels: Record<TipoMovimento, string> = {
    capitale: 'Capitale',
    anticipazione: 'Anticipazione',
    compenso: 'Compenso legale',
    interessi: 'Interessi',
    recupero_capitale: 'Recupero capitale',
    recupero_anticipazione: 'Recupero anticipazione',
    recupero_compenso: 'Recupero compenso',
    recupero_interessi: 'Recupero interessi',
  };
  return labels[tipo] || tipo;
}

// Helper per determinare se è un movimento di recupero
export function isRecupero(tipo: TipoMovimento): boolean {
  return tipo.startsWith('recupero_');
}
