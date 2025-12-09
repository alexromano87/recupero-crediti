// apps/frontend/src/api/pratiche.ts
import { api } from './config';

// ====== Tipi ======

export type FasePratica =
  | 'analisi_preliminare'
  | 'messa_in_mora'
  | 'decreto_ingiuntivo'
  | 'esecuzione_forzata'
  | 'pignoramento'
  | 'chiusa';

export type EsitoPratica = 'positivo' | 'negativo' | null;

export interface StoricoFase {
  fase: FasePratica;
  dataInizio: string;
  dataFine?: string;
  note?: string;
}

export interface Pratica {
  id: string;
  attivo: boolean;

  // Relazioni
  clienteId: string;
  debitoreId: string;
  cliente?: {
    id: string;
    ragioneSociale: string;
    attivo: boolean;
  };
  debitore?: {
    id: string;
    tipoSoggetto: 'persona_fisica' | 'persona_giuridica';
    nome?: string;
    cognome?: string;
    ragioneSociale?: string;
    attivo: boolean;
  };

  // Stato
  fase: FasePratica;
  aperta: boolean;
  esito: EsitoPratica;

  // Importi
  capitale: number;
  importoRecuperatoCapitale: number;
  anticipazioni: number;
  importoRecuperatoAnticipazioni: number;
  compensiLegali: number;
  compensiLiquidati: number;
  interessi: number;
  interessiRecuperati: number;

  // Note e riferimenti
  note?: string;
  riferimentoCredito?: string;

  // Storico
  storico?: StoricoFase[];

  // Date
  dataAffidamento?: string;
  dataChiusura?: string;
  dataScadenza?: string;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface PraticaCreatePayload {
  clienteId: string;
  debitoreId: string;
  fase?: FasePratica;
  aperta?: boolean;
  esito?: EsitoPratica;
  capitale?: number;
  importoRecuperatoCapitale?: number;
  anticipazioni?: number;
  importoRecuperatoAnticipazioni?: number;
  compensiLegali?: number;
  compensiLiquidati?: number;
  interessi?: number;
  interessiRecuperati?: number;
  note?: string;
  riferimentoCredito?: string;
  dataAffidamento?: string;
  dataChiusura?: string;
  dataScadenza?: string;
}

export interface PraticaUpdatePayload extends Partial<Omit<PraticaCreatePayload, 'fase'>> {}

export interface CambiaFasePayload {
  nuovaFase: FasePratica;
  esito?: 'positivo' | 'negativo';
  note?: string;
}

export interface PraticheStats {
  aperte: number;
  chiusePositive: number;
  chiuseNegative: number;
  totali: number;
  capitaleAffidato: number;
  capitaleRecuperato: number;
  capitaleDaRecuperare: number;
  anticipazioni: number;
  anticipazioniRecuperate: number;
  compensiMaturati: number;
  compensiLiquidati: number;
  perFase: Record<FasePratica, number>;
}

// ====== CRUD Pratiche ======

export function fetchPratiche(
  options: {
    includeInactive?: boolean;
    clienteId?: string;
    debitoreId?: string;
  } = {},
): Promise<Pratica[]> {
  const params: Record<string, string> = {};
  if (options.includeInactive) params.includeInactive = 'true';
  if (options.clienteId) params.clienteId = options.clienteId;
  if (options.debitoreId) params.debitoreId = options.debitoreId;

  return api.get<Pratica[]>('/pratiche', Object.keys(params).length > 0 ? params : undefined);
}

export function fetchPratica(id: string): Promise<Pratica> {
  return api.get<Pratica>(`/pratiche/${id}`);
}

export function fetchPraticheStats(): Promise<PraticheStats> {
  return api.get<PraticheStats>('/pratiche/stats');
}

export function createPratica(payload: PraticaCreatePayload): Promise<Pratica> {
  return api.post<Pratica>('/pratiche', payload);
}

export function updatePratica(
  id: string,
  payload: PraticaUpdatePayload,
): Promise<Pratica> {
  return api.put<Pratica>(`/pratiche/${id}`, payload);
}

export function deletePratica(id: string): Promise<void> {
  return api.delete<void>(`/pratiche/${id}`);
}

// ====== Gestione stato ======

export function cambiaFasePratica(
  id: string,
  payload: CambiaFasePayload,
): Promise<Pratica> {
  return api.patch<Pratica>(`/pratiche/${id}/fase`, payload);
}

export function riapriPratica(
  id: string,
  fase?: FasePratica,
): Promise<Pratica> {
  return api.patch<Pratica>(`/pratiche/${id}/riapri`, { fase });
}

export function deactivatePratica(id: string): Promise<Pratica> {
  return api.patch<Pratica>(`/pratiche/${id}/deactivate`, {});
}

export function reactivatePratica(id: string): Promise<Pratica> {
  return api.patch<Pratica>(`/pratiche/${id}/reactivate`, {});
}

// ====== Helper functions ======

export const FASI_LABELS: Record<FasePratica, string> = {
  analisi_preliminare: 'Analisi preliminare',
  messa_in_mora: 'Messa in mora',
  decreto_ingiuntivo: 'Decreto ingiuntivo',
  esecuzione_forzata: 'Esecuzione forzata',
  pignoramento: 'Pignoramento',
  chiusa: 'Chiusa',
};

export const FASI_ORDER: FasePratica[] = [
  'analisi_preliminare',
  'messa_in_mora',
  'decreto_ingiuntivo',
  'esecuzione_forzata',
  'pignoramento',
  'chiusa',
];

export const ESITI_LABELS: Record<string, string> = {
  positivo: 'Esito positivo',
  negativo: 'Esito negativo',
};

export function getFaseLabel(fase: FasePratica): string {
  return FASI_LABELS[fase] || fase;
}

export function getEsitoLabel(esito: EsitoPratica): string {
  if (!esito) return 'In corso';
  return ESITI_LABELS[esito] || esito;
}

export function getDebitoreDisplayName(debitore?: Pratica['debitore']): string {
  if (!debitore) return '(Debitore non trovato)';
  if (debitore.tipoSoggetto === 'persona_fisica') {
    const full = `${debitore.nome ?? ''} ${debitore.cognome ?? ''}`.trim();
    return full || '(Senza nome)';
  }
  return debitore.ragioneSociale || '(Senza ragione sociale)';
}

export function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

export function getCapitaleDaRecuperare(pratica: Pratica): number {
  return (pratica.capitale || 0) - (pratica.importoRecuperatoCapitale || 0);
}

export function getPercentualeRecupero(pratica: Pratica): number {
  if (!pratica.capitale || pratica.capitale === 0) return 0;
  return ((pratica.importoRecuperatoCapitale || 0) / pratica.capitale) * 100;
}