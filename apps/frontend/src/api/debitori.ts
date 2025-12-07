// apps/frontend/src/api/debitori.ts
import type { Cliente } from './clienti';

const API_BASE_URL = 'http://localhost:3000';

export type TipoSoggetto = 'persona_fisica' | 'persona_giuridica';

export interface Debitore {
  id: string;
  tipoSoggetto: TipoSoggetto;

  // persona fisica
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
  dataNascita?: string;
  luogoNascita?: string;

  // persona giuridica
  ragioneSociale?: string;
  partitaIva?: string;
  tipologia?: string;
  sedeLegale?: string;
  sedeOperativa?: string;

  // comuni
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  nazione?: string;

  referente?: string;
  telefono?: string;
  email?: string;
  pec?: string;

  createdAt: string;
  updatedAt: string;
}

export type DebitoreCreatePayload = {
  tipoSoggetto: TipoSoggetto;

  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
  dataNascita?: string;
  luogoNascita?: string;

  ragioneSociale?: string;
  partitaIva?: string;
  tipologia?: string;
  sedeLegale?: string;
  sedeOperativa?: string;

  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  nazione?: string;

  referente?: string;
  telefono?: string;
  email?: string;
  pec?: string;

  // cliente a cui agganciare il debitore
  clientiIds: string[];
};

// Debitori collegati a un cliente specifico
export async function fetchDebitoriForCliente(
  clienteId: string,
): Promise<Debitore[]> {
  const res = await fetch(`${API_BASE_URL}/clienti/${clienteId}/debitori`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text || 'Errore nel recupero dei debitori per il cliente selezionato',
    );
  }
  return res.json();
}

// Creazione debitore agganciato al cliente
export async function createDebitore(
  payload: DebitoreCreatePayload,
): Promise<Debitore> {
  const res = await fetch(`${API_BASE_URL}/debitori`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Errore nella creazione del debitore');
  }

  return res.json();
}

// Scollega un debitore da un cliente (non cancella l’anagrafica)
export async function unlinkDebitoreFromCliente(
  clienteId: string,
  debitoreId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/clienti/${clienteId}/debitori/${debitoreId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Errore nello scollegamento del debitore');
  }
}

// Helper per nome visualizzato
export function getDebitoreDisplayName(d: Debitore): string {
  if (d.tipoSoggetto === 'persona_fisica') {
    const full = `${d.nome ?? ''} ${d.cognome ?? ''}`.trim();
    return full || '(Senza nome)';
  }
  return d.ragioneSociale || '(Senza ragione sociale)';
}
