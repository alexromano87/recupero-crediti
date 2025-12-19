// apps/backend/src/cartelle/cartelle.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Cartella } from './cartella.entity';
import { CreateCartellaDto } from './dto/create-cartella.dto';
import { UpdateCartellaDto } from './dto/update-cartella.dto';

@Injectable()
export class CartelleService {
  constructor(
    @InjectRepository(Cartella)
    private cartelleRepository: TreeRepository<Cartella>,
  ) {}

  async create(createDto: CreateCartellaDto): Promise<Cartella> {
    const cartella = this.cartelleRepository.create({
      nome: createDto.nome,
      descrizione: createDto.descrizione,
      colore: createDto.colore,
      praticaId: createDto.praticaId,
      studioId: createDto.studioId,
    });

    // If there's a parent folder, set the relationship
    if (createDto.cartellaParentId) {
      const parent = await this.findOne(createDto.cartellaParentId);
      cartella.cartellaParent = parent;
    }

    return this.cartelleRepository.save(cartella);
  }

  async findAll(includeInactive = false, studioId?: string): Promise<Cartella[]> {
    const where: any = includeInactive ? {} : { attivo: true };

    if (studioId !== undefined) {
      where.studioId = studioId;
    }

    return this.cartelleRepository.find({
      where,
      relations: ['pratica', 'documenti'],
      order: { dataCreazione: 'DESC' },
    });
  }

  async findByPratica(praticaId: string, includeInactive = false): Promise<Cartella[]> {
    const where = includeInactive
      ? { praticaId }
      : { praticaId, attivo: true };
    return this.cartelleRepository.find({
      where,
      relations: ['documenti', 'sottoCartelle'],
      order: { dataCreazione: 'DESC' },
    });
  }

  async findTree(praticaId?: string): Promise<Cartella[]> {
    // Get all root folders (folders without a parent)
    const roots = await this.cartelleRepository.find({
      where: praticaId
        ? { praticaId, cartellaParent: null as any, attivo: true }
        : { cartellaParent: null as any, attivo: true },
      relations: ['documenti'],
    });

    // For each root, get the tree
    const trees = await Promise.all(
      roots.map((root) =>
        this.cartelleRepository.findDescendantsTree(root),
      ),
    );

    return trees;
  }

  async findOne(id: string): Promise<Cartella> {
    const cartella = await this.cartelleRepository.findOne({
      where: { id },
      relations: ['pratica', 'documenti', 'cartellaParent', 'sottoCartelle'],
    });
    if (!cartella) {
      throw new NotFoundException(`Cartella con ID ${id} non trovata`);
    }
    return cartella;
  }

  async findDescendants(id: string): Promise<Cartella[]> {
    const cartella = await this.findOne(id);
    return this.cartelleRepository.findDescendants(cartella);
  }

  async findAncestors(id: string): Promise<Cartella[]> {
    const cartella = await this.findOne(id);
    return this.cartelleRepository.findAncestors(cartella);
  }

  async update(id: string, updateDto: UpdateCartellaDto): Promise<Cartella> {
    const cartella = await this.findOne(id);

    // Update basic fields
    if (updateDto.nome) cartella.nome = updateDto.nome;
    if (updateDto.descrizione !== undefined) cartella.descrizione = updateDto.descrizione;
    if (updateDto.colore !== undefined) cartella.colore = updateDto.colore;

    // Update parent if provided
    if (updateDto.cartellaParentId !== undefined) {
      if (updateDto.cartellaParentId === null) {
        cartella.cartellaParent = null;
      } else {
        const parent = await this.findOne(updateDto.cartellaParentId);
        cartella.cartellaParent = parent;
      }
    }

    return this.cartelleRepository.save(cartella);
  }

  async deactivate(id: string): Promise<Cartella> {
    const cartella = await this.findOne(id);
    cartella.attivo = false;
    return this.cartelleRepository.save(cartella);
  }

  async reactivate(id: string): Promise<Cartella> {
    const cartella = await this.cartelleRepository.findOne({
      where: { id },
      relations: ['pratica', 'documenti'],
    });
    if (!cartella) {
      throw new NotFoundException(`Cartella con ID ${id} non trovata`);
    }
    cartella.attivo = true;
    return this.cartelleRepository.save(cartella);
  }

  async remove(id: string): Promise<void> {
    const cartella = await this.findOne(id);
    await this.cartelleRepository.remove(cartella);
  }
}
