import { api } from './config';

export interface Studio {
  id: string;
  nome: string;
  ragioneSociale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  pec?: string;
  attivo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudioDto {
  nome: string;
  ragioneSociale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  pec?: string;
}

export interface UpdateStudioDto {
  nome?: string;
  ragioneSociale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  pec?: string;
  attivo?: boolean;
}

export const studiApi = {
  getAll: async (): Promise<Studio[]> => {
    return api.get<Studio[]>('/studi');
  },

  getAllActive: async (): Promise<Studio[]> => {
    return api.get<Studio[]>('/studi/active');
  },

  getOne: async (id: string): Promise<Studio> => {
    return api.get<Studio>(`/studi/${id}`);
  },

  create: async (createDto: CreateStudioDto): Promise<Studio> => {
    return api.post<Studio>('/studi', createDto);
  },

  update: async (id: string, updateDto: UpdateStudioDto): Promise<Studio> => {
    return api.put<Studio>(`/studi/${id}`, updateDto);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/studi/${id}`);
  },

  toggleActive: async (id: string): Promise<Studio> => {
    return api.put<Studio>(`/studi/${id}/toggle-active`, {});
  },
};
