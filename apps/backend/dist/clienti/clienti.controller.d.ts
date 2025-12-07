import { ClientiService } from './clienti.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ClientiDebitoriService } from '../relazioni/clienti-debitori.service';
export declare class ClientiController {
    private readonly clientiService;
    private readonly clientiDebitoriService;
    constructor(clientiService: ClientiService, clientiDebitoriService: ClientiDebitoriService);
    findAll(): Promise<import("./cliente.entity").Cliente[]>;
    findOne(id: string): Promise<import("./cliente.entity").Cliente | null>;
    create(dto: CreateClienteDto): Promise<import("./cliente.entity").Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<import("./cliente.entity").Cliente | null>;
    remove(id: string): Promise<import("./cliente.entity").Cliente | null>;
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
