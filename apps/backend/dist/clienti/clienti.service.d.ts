import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export declare class ClientiService {
    private readonly repo;
    constructor(repo: Repository<Cliente>);
    create(data: CreateClienteDto): Promise<Cliente>;
    findAll(): Promise<Cliente[]>;
    findOne(id: string): Promise<Cliente | null>;
    update(id: string, data: UpdateClienteDto): Promise<Cliente | null>;
    remove(id: string): Promise<Cliente | null>;
}
