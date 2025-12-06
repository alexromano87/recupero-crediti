export interface Cliente {
  id: string;
  ragioneSociale: string;
  codiceFiscale?: string;
  partitaIva?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  nazione?: string;
  telefono?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:3000';

export async function fetchClienti(): Promise<Cliente[]> {
  const res = await fetch(`${API_BASE_URL}/clienti`);
  if (!res.ok) {
    throw new Error('Errore nel recupero dei clienti');
  }
  return res.json();
}

export async function createCliente(
  data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Cliente> {
  const res = await fetch(`${API_BASE_URL}/clienti`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Errore creazione cliente: ${text}`);
  }

  return res.json();
}
