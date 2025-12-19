// apps/backend/src/documenti/documenti.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './documento.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class DocumentiService {
  constructor(
    @InjectRepository(Documento)
    private documentiRepository: Repository<Documento>,
  ) {}

  async create(createDto: CreateDocumentoDto): Promise<Documento> {
    const documento = this.documentiRepository.create(createDto);
    return this.documentiRepository.save(documento);
  }

  async findAll(includeInactive = false, studioId?: string): Promise<Documento[]> {
    const where: any = includeInactive ? {} : { attivo: true };

    if (studioId !== undefined) {
      where.studioId = studioId;
    }

    return this.documentiRepository.find({
      where,
      relations: ['pratica', 'cartella'],
      order: { dataCreazione: 'DESC' },
    });
  }

  async findByPratica(praticaId: string, includeInactive = false): Promise<Documento[]> {
    const where = includeInactive
      ? { praticaId }
      : { praticaId, attivo: true };
    return this.documentiRepository.find({
      where,
      relations: ['cartella'],
      order: { dataCreazione: 'DESC' },
    });
  }

  async findByCartella(cartellaId: string, includeInactive = false): Promise<Documento[]> {
    const where = includeInactive
      ? { cartellaId }
      : { cartellaId, attivo: true };
    return this.documentiRepository.find({
      where,
      order: { dataCreazione: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Documento> {
    const documento = await this.documentiRepository.findOne({
      where: { id },
      relations: ['pratica', 'cartella'],
    });
    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} non trovato`);
    }
    return documento;
  }

  async update(id: string, updateDto: UpdateDocumentoDto): Promise<Documento> {
    const documento = await this.findOne(id);
    Object.assign(documento, updateDto);
    return this.documentiRepository.save(documento);
  }

  async deactivate(id: string): Promise<Documento> {
    const documento = await this.findOne(id);
    documento.attivo = false;
    return this.documentiRepository.save(documento);
  }

  async reactivate(id: string): Promise<Documento> {
    const documento = await this.documentiRepository.findOne({
      where: { id },
      relations: ['pratica', 'cartella'],
    });
    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} non trovato`);
    }
    documento.attivo = true;
    return this.documentiRepository.save(documento);
  }

  async remove(id: string): Promise<void> {
    const documento = await this.findOne(id);

    // Delete the physical file from disk
    try {
      if (fs.existsSync(documento.percorsoFile)) {
        await unlinkAsync(documento.percorsoFile);
      }
    } catch (error) {
      console.error(`Error deleting file: ${documento.percorsoFile}`, error);
    }

    await this.documentiRepository.remove(documento);
  }

  async getFileStream(id: string): Promise<{ stream: fs.ReadStream; documento: Documento }> {
    const documento = await this.findOne(id);

    if (!fs.existsSync(documento.percorsoFile)) {
      throw new NotFoundException(`File fisico non trovato: ${documento.percorsoFile}`);
    }

    const stream = fs.createReadStream(documento.percorsoFile);
    return { stream, documento };
  }
}
