// apps/backend/src/alerts/alerts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, MessaggioAlert } from './alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AddMessaggioDto } from './dto/add-messaggio.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...createAlertDto,
      giorniAnticipo: createAlertDto.giorniAnticipo ?? 3,
      messaggi: [],
    });
    return this.alertRepository.save(alert);
  }

  async findAll(includeInactive = false, studioId?: string): Promise<Alert[]> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('alert.dataScadenza', 'ASC');

    if (!includeInactive) {
      query.andWhere('alert.attivo = :attivo', { attivo: true });
    }

    // Se studioId è definito, filtra per studio
    if (studioId !== undefined) {
      query.andWhere('alert.studioId = :studioId', { studioId });
    }

    return query.getMany();
  }

  async findAllByPratica(praticaId: string, includeInactive = false): Promise<Alert[]> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.praticaId = :praticaId', { praticaId })
      .leftJoinAndSelect('alert.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('alert.dataScadenza', 'ASC');

    if (!includeInactive) {
      query.andWhere('alert.attivo = :attivo', { attivo: true });
    }

    return query.getMany();
  }

  async findAllByStato(stato: 'in_gestione' | 'chiuso', includeInactive = false, studioId?: string): Promise<Alert[]> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.stato = :stato', { stato })
      .leftJoinAndSelect('alert.pratica', 'pratica')
      .leftJoinAndSelect('pratica.cliente', 'cliente')
      .leftJoinAndSelect('pratica.debitore', 'debitore')
      .orderBy('alert.dataScadenza', 'ASC');

    if (!includeInactive) {
      query.andWhere('alert.attivo = :attivo', { attivo: true });
    }

    // Se studioId è definito, filtra per studio
    if (studioId !== undefined) {
      query.andWhere('alert.studioId = :studioId', { studioId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['pratica', 'pratica.cliente', 'pratica.debitore'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert con ID ${id} non trovato`);
    }

    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);

    // Se si sta chiudendo l'alert, imposta dataChiusura
    if (updateAlertDto.stato === 'chiuso' && alert.stato !== 'chiuso') {
      Object.assign(alert, updateAlertDto, { dataChiusura: new Date() });
    } else if (updateAlertDto.stato === 'in_gestione' && alert.stato === 'chiuso') {
      // Se si riapre l'alert, rimuovi dataChiusura
      Object.assign(alert, updateAlertDto, { dataChiusura: null });
    } else {
      Object.assign(alert, updateAlertDto);
    }

    return this.alertRepository.save(alert);
  }

  async deactivate(id: string): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.attivo = false;
    return this.alertRepository.save(alert);
  }

  async reactivate(id: string): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.attivo = true;
    return this.alertRepository.save(alert);
  }

  async remove(id: string): Promise<void> {
    const alert = await this.findOne(id);
    await this.alertRepository.remove(alert);
  }

  async addMessaggio(id: string, addMessaggioDto: AddMessaggioDto): Promise<Alert> {
    const alert = await this.findOne(id);

    const nuovoMessaggio: MessaggioAlert = {
      id: uuidv4(),
      autore: addMessaggioDto.autore,
      testo: addMessaggioDto.testo,
      dataInvio: new Date(),
    };

    alert.messaggi = [...(alert.messaggi || []), nuovoMessaggio];
    return this.alertRepository.save(alert);
  }

  async chiudiAlert(id: string): Promise<Alert> {
    return this.update(id, { stato: 'chiuso' });
  }

  async riapriAlert(id: string): Promise<Alert> {
    return this.update(id, { stato: 'in_gestione' });
  }
}
