import { ClientiService } from './clienti.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export declare class ClientiController {
    private readonly clientiService;
    constructor(clientiService: ClientiService);
    create(dto: CreateClienteDto): Promise<import("./cliente.entity").Cliente>;
    findAll(): Promise<import("./cliente.entity").Cliente[]>;
    findOne(id: string): Promise<import("./cliente.entity").Cliente | null>;
    update(id: string, dto: UpdateClienteDto): Promise<import("./cliente.entity").Cliente | null>;
    remove(id: string): Promise<import("./cliente.entity").Cliente | null>;
}
