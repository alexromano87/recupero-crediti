import { ClientiService } from './clienti.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ClientiDebitoriService } from '../relazioni/clienti-debitori.service';
export declare class ClientiController {
    private readonly clientiService;
    private readonly clientiDebitoriService;
    constructor(clientiService: ClientiService, clientiDebitoriService: ClientiDebitoriService);
    findAll(includeInactive?: string): Promise<import("./cliente.entity").Cliente[]>;
    findOne(id: string): Promise<import("./cliente.entity").Cliente>;
    getPraticheCount(id: string): Promise<{
        count: number;
    }>;
    create(dto: CreateClienteDto): Promise<import("./cliente.entity").Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<import("./cliente.entity").Cliente>;
    deactivate(id: string): Promise<{
        attivo: boolean;
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
        tipologia?: import("./cliente.entity").TipologiaAzienda;
        referente?: string;
        telefono?: string;
        email?: string;
        pec?: string;
        clientiDebitori: import("../relazioni/cliente-debitore.entity").ClienteDebitore[];
    }>;
    reactivate(id: string): Promise<{
        attivo: boolean;
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
        tipologia?: import("./cliente.entity").TipologiaAzienda;
        referente?: string;
        telefono?: string;
        email?: string;
        pec?: string;
        clientiDebitori: import("../relazioni/cliente-debitore.entity").ClienteDebitore[];
    }>;
    remove(id: string): Promise<import("./cliente.entity").Cliente>;
    getDebitoriForCliente(id: string): Promise<import("../debitori/debitore.entity").Debitore[]>;
    updateDebitoriForCliente(id: string, body: {
        debitoriIds: string[];
    }): Promise<{
        success: boolean;
    }>;
    unlinkDebitore(id: string, debitoreId: string): Promise<{
        success: boolean;
    }>;
}
