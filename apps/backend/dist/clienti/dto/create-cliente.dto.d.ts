import type { TipologiaAzienda } from '../cliente.entity';
export declare class CreateClienteDto {
    ragioneSociale: string;
    codiceFiscale?: string;
    partitaIva?: string;
    sedeLegale?: string;
    sedeOperativa?: string;
    indirizzo?: string;
    cap?: string;
    citta?: string;
    provincia?: string;
    nazione?: string;
    tipologia?: TipologiaAzienda;
    referente?: string;
    telefono?: string;
    email?: string;
    pec?: string;
}
