// apps/frontend/src/features/clienti/constants.ts
export type ClienteFormState = {
  ragioneSociale: string;
  partitaIva: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  telefono: string;
  email: string;
};

export const CLIENTE_INITIAL_FORM: ClienteFormState = {
  ragioneSociale: '',
  partitaIva: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  nazione: 'IT',
  telefono: '',
  email: '',
};

export const CLIENTE_FIELD_CONFIG = {
  ragioneSociale: {
    label: 'Ragione sociale*',
    placeholder: 'Es. ACME S.r.l.',
  },
  partitaIva: {
    label: 'Partita IVA',
    placeholder: '12345678901',
  },
  telefono: {
    label: 'Telefono',
    placeholder: '+39 ...',
  },
  indirizzo: {
    label: 'Indirizzo',
    placeholder: 'Via Roma 1',
  },
  cap: {
    label: 'CAP',
    placeholder: '24100',
  },
  citta: {
    label: 'Città',
    placeholder: 'Bergamo',
  },
  provincia: {
    label: 'Provincia',
    placeholder: 'BG',
  },
  email: {
    label: 'Email',
    placeholder: 'esempio@studio.it',
  },
} as const;

export const NAZIONI_OPTIONS = [
  { value: 'IT', label: 'Italia' },
  { value: 'SM', label: 'San Marino' },
  { value: 'VA', label: 'Città del Vaticano' },
  { value: 'CH', label: 'Svizzera' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Germania' },
  { value: 'AT', label: 'Austria' },
] as const;
