export type TipologiaAzienda = 'impresa_individuale' | 'impresa_individuale_agricola' | 'srl' | 'spa' | 'scpa' | 'srl_agricola' | 'snc' | 'sas';
export declare class Cliente {
    id: string;
    createdAt: Date;
    updatedAt: Date;
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
