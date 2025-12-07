// src/debitori/debitori.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debitore } from './debitore.entity';
import { CreateDebitoreDto } from './dto/create-debitore.dto';
import { UpdateDebitoreDto } from './dto/update-debitore.dto';
import { ClientiDebitoriService } from '../relazioni/clienti-debitori.service';

@Injectable()
export class DebitoriService {
  constructor(
    @InjectRepository(Debitore)
    private readonly repo: Repository<Debitore>,
    private readonly clientiDebitoriService: ClientiDebitoriService,
  ) {}

  async findAll(): Promise<Debitore[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Debitore | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateDebitoreDto): Promise<Debitore> {
    const { clientiIds, ...rest } = dto;

    const debitore = this.repo.create({
      ...rest,
      dataNascita: rest.dataNascita
        ? new Date(rest.dataNascita)
        : undefined,
    });

    const saved = await this.repo.save(debitore);

    if (!clientiIds || clientiIds.length === 0) {
      // se vuoi essere rigido: throw new BadRequestException('È necessario almeno un cliente.');
      return saved;
    }

    await this.clientiDebitoriService.setDebitoriForCliente(
      clientiIds[0],
      [saved.id],
    );

    // Se vuoi supportare subito più clienti:
    // for (const clienteId of clientiIds) {
    //   await this.clientiDebitoriService.setDebitoriForCliente(clienteId, [...debitori già collegati, saved.id]);
    // }

    return saved;
  }

  async update(id: string, dto: UpdateDebitoreDto): Promise<Debitore | null> {
    const { clientiIds, ...rest } = dto;

    await this.repo.update(
      { id },
      {
        ...rest,
        dataNascita: rest.dataNascita
          ? new Date(rest.dataNascita)
          : undefined,
      },
    );

    if (clientiIds && clientiIds.length > 0) {
      // logica: se passi clientiIds, potresti voler riallineare, ma qui
      // serve decidere esattamente cosa vuoi fare (per ora possiamo lasciarlo in sospeso).
      // Possiamo decidere:
      // - gestire i link solo da lato /clienti/:id/debitori
      // - oppure aggiornare qui per tutti i clientiIds
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // qui potresti controllare che non ci siano pratiche collegate prima di cancellare
    await this.repo.delete({ id });
  }
}
