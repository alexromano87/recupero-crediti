// apps/backend/src/avvocati/avvocati.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avvocato } from './avvocato.entity';
import { CreateAvvocatoDto } from './create-avvocato.dto';
import { UpdateAvvocatoDto } from './update-avvocato.dto';

@Injectable()
export class AvvocatiService {
  constructor(
    @InjectRepository(Avvocato)
    private avvocatiRepository: Repository<Avvocato>,
  ) {}

  async create(createAvvocatoDto: CreateAvvocatoDto): Promise<Avvocato> {
    // Verifica se email già esistente
    const existing = await this.avvocatiRepository.findOne({
      where: { email: createAvvocatoDto.email },
    });
    if (existing) {
      throw new ConflictException('Email già registrata');
    }

    const avvocato = this.avvocatiRepository.create(createAvvocatoDto);
    return await this.avvocatiRepository.save(avvocato);
  }

  async findAll(includeInactive = false, studioId?: string): Promise<Avvocato[]> {
    const where: any = includeInactive ? {} : { attivo: true };

    // Se studioId è definito, filtra per studio
    if (studioId !== undefined) {
      where.studioId = studioId;
    }

    return await this.avvocatiRepository.find({
      where,
      order: { cognome: 'ASC', nome: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Avvocato> {
    const avvocato = await this.avvocatiRepository.findOne({
      where: { id },
      relations: ['pratiche'],
    });
    if (!avvocato) {
      throw new NotFoundException(`Avvocato con id ${id} non trovato`);
    }
    return avvocato;
  }

  async update(id: string, updateAvvocatoDto: UpdateAvvocatoDto): Promise<Avvocato> {
    const avvocato = await this.findOne(id);

    // Se sta cambiando email, verifica che non sia già usata
    if (updateAvvocatoDto.email && updateAvvocatoDto.email !== avvocato.email) {
      const existing = await this.avvocatiRepository.findOne({
        where: { email: updateAvvocatoDto.email },
      });
      if (existing) {
        throw new ConflictException('Email già registrata');
      }
    }

    Object.assign(avvocato, updateAvvocatoDto);
    return await this.avvocatiRepository.save(avvocato);
  }

  async deactivate(id: string): Promise<Avvocato> {
    const avvocato = await this.findOne(id);
    avvocato.attivo = false;
    return await this.avvocatiRepository.save(avvocato);
  }

  async reactivate(id: string): Promise<Avvocato> {
    const avvocato = await this.findOne(id);
    avvocato.attivo = true;
    return await this.avvocatiRepository.save(avvocato);
  }

  async remove(id: string): Promise<void> {
    const avvocato = await this.avvocatiRepository.findOne({
      where: { id },
      relations: ['pratiche'],
    });

    if (!avvocato) {
      throw new NotFoundException(`Avvocato con id ${id} non trovato`);
    }

    // Verifica che non sia associato a pratiche
    if (avvocato.pratiche && avvocato.pratiche.length > 0) {
      throw new ConflictException(
        'Impossibile eliminare: avvocato associato a una o più pratiche',
      );
    }

    await this.avvocatiRepository.remove(avvocato);
  }
}
