import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientiService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repo: Repository<Cliente>,
  ) {}

  async create(data: CreateClienteDto) {
    const cliente = this.repo.create(data);
    return this.repo.save(cliente);
  }

  async findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async update(id: string, data: UpdateClienteDto) {
    await this.repo.update({ id }, data);
    return this.findOne(id); // ritorna il record aggiornato
  }

  async remove(id: string) {
    const cliente = await this.findOne(id);
    if (!cliente) return null;
    await this.repo.delete({ id });
    return cliente; // opzionale, ma utile per logging o conferma
  }
}
