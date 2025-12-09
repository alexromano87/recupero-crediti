// apps/frontend/src/api/fasi.ts
import { api } from './config';

// ====== Tipi ======

export interface Fase {
  id: string;
  nome: string;
  codice: string;
  descrizione?: string;
  ordine: number;
  colore?: string;
  icona?: string;
  isFaseChiusura: boolean;
  attivo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaseCreatePayload {
  nome: string;
  codice: string;
  descrizione?: string;
  ordine?: number;
  colore?: string;
  icona?: string;
  isFaseChiusura?: boolean;
}

export interface FaseUpdatePayload extends Partial<FaseCreatePayload> {}

// ====== CRUD Fasi ======

export function fetchFasi(includeInactive = false): Promise<Fase[]> {
  const params = includeInactive ? { includeInactive: 'true' } : undefined;
  return api.get<Fase[]>('/fasi', params);
}

export function fetchFase(id: string): Promise<Fase> {
  return api.get<Fase>(`/fasi/${id}`);
}

export function createFase(payload: FaseCreatePayload): Promise<Fase> {
  return api.post<Fase>('/fasi', payload);
}

export function updateFase(id: string, payload: FaseUpdatePayload): Promise<Fase> {
  return api.put<Fase>(`/fasi/${id}`, payload);
}

export function deleteFase(id: string): Promise<void> {
  return api.delete<void>(`/fasi/${id}`);
}

export function deactivateFase(id: string): Promise<Fase> {
  return api.patch<Fase>(`/fasi/${id}/deactivate`, {});
}

export function reactivateFase(id: string): Promise<Fase> {
  return api.patch<Fase>(`/fasi/${id}/reactivate`, {});
}

export function reorderFasi(orderedIds: string[]): Promise<Fase[]> {
  return api.put<Fase[]>('/fasi/reorder', { orderedIds });
}

export function initializeFasi(): Promise<void> {
  return api.post<void>('/fasi/initialize', {});
}

// ====== Helper functions ======

export function getFaseLabel(fase: Fase | undefined): string {
  return fase?.nome || '(Fase sconosciuta)';
}

export function getFaseColor(fase: Fase | undefined): string {
  return fase?.colore || '#6B7280'; // gray-500 default
}