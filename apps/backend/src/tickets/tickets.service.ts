// apps/backend/src/tickets/tickets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, MessaggioTicket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddMessaggioDto } from './dto/add-messaggio.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      priorita: createTicketDto.priorita ?? 'normale',
      messaggi: [],
    });
    return this.ticketRepository.save(ticket);
  }

  async findAll(includeInactive = false, studioId?: string): Promise<Ticket[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('ticket.dataCreazione', 'DESC');

    if (!includeInactive) {
      query.andWhere('ticket.attivo = :attivo', { attivo: true });
    }

    if (studioId !== undefined) {
      query.andWhere('ticket.studioId = :studioId', { studioId });
    }

    return query.getMany();
  }

  async findAllByPratica(praticaId: string, includeInactive = false): Promise<Ticket[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.praticaId = :praticaId', { praticaId })
      .leftJoinAndSelect('ticket.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('ticket.dataCreazione', 'DESC');

    if (!includeInactive) {
      query.andWhere('ticket.attivo = :attivo', { attivo: true });
    }

    return query.getMany();
  }

  async findAllByStato(stato: 'aperto' | 'in_gestione' | 'chiuso', includeInactive = false): Promise<Ticket[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.stato = :stato', { stato })
      .leftJoinAndSelect('ticket.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('ticket.dataCreazione', 'DESC');

    if (!includeInactive) {
      query.andWhere('ticket.attivo = :attivo', { attivo: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['pratica', 'pratica.cliente', 'pratica.debitore'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} non trovato`);
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Se si sta chiudendo il ticket, imposta dataChiusura
    if (updateTicketDto.stato === 'chiuso' && ticket.stato !== 'chiuso') {
      Object.assign(ticket, updateTicketDto, { dataChiusura: new Date() });
    } else if (updateTicketDto.stato !== 'chiuso' && ticket.stato === 'chiuso') {
      // Se si riapre il ticket, rimuovi dataChiusura
      Object.assign(ticket, updateTicketDto, { dataChiusura: null });
    } else {
      Object.assign(ticket, updateTicketDto);
    }

    return this.ticketRepository.save(ticket);
  }

  async deactivate(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.attivo = false;
    return this.ticketRepository.save(ticket);
  }

  async reactivate(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.attivo = true;
    return this.ticketRepository.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async addMessaggio(id: string, addMessaggioDto: AddMessaggioDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    const nuovoMessaggio: MessaggioTicket = {
      id: uuidv4(),
      autore: addMessaggioDto.autore,
      testo: addMessaggioDto.testo,
      dataInvio: new Date(),
    };

    ticket.messaggi = [...(ticket.messaggi || []), nuovoMessaggio];
    return this.ticketRepository.save(ticket);
  }

  async chiudiTicket(id: string): Promise<Ticket> {
    return this.update(id, { stato: 'chiuso' });
  }

  async prendiInCarico(id: string): Promise<Ticket> {
    return this.update(id, { stato: 'in_gestione' });
  }

  async riapriTicket(id: string): Promise<Ticket> {
    return this.update(id, { stato: 'aperto' });
  }
}
