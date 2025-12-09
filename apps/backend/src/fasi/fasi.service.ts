// src/fasi/fasi.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fase } from './fase.entity';
import { CreateFaseDto } from './dto/create-fase.dto';
import { UpdateFaseDto } from './dto/update-fase.dto';

@Injectable()
export class FasiService {
  constructor(
    @InjectRepository(Fase)
    private readonly repo: Repository<Fase>,
  ) {}

  /**
   * Restituisce tutte le fasi ordinate per 'ordine'.
   */
  async findAll(includeInactive = false): Promise<Fase[]> {
    const where = includeInactive ? {} : { attivo: true };
    return this.repo.find({
      where,
      order: { ordine: 'ASC', nome: 'ASC' },
    });
  }

  /**
   * Restituisce una fase per ID.
   */
  async findOne(id: string): Promise<Fase> {
    const fase = await this.repo.findOne({ where: { id } });
    if (!fase) {
      throw new NotFoundException(`Fase con ID ${id} non trovata`);
    }
    return fase;
  }

  /**
   * Restituisce una fase per codice.
   */
  async findByCodice(codice: string): Promise<Fase | null> {
    return this.repo.findOne({ where: { codice } });
  }

  /**
   * Crea una nuova fase.
   */
  async create(dto: CreateFaseDto): Promise<Fase> {
    // Verifica unicità codice
    const existing = await this.findByCodice(dto.codice);
    if (existing) {
      throw new ConflictException(
        `Esiste già una fase con codice "${dto.codice}"`,
      );
    }

    // Se non specificato ordine, metti alla fine
    if (dto.ordine === undefined) {
      const maxOrdine = await this.repo
        .createQueryBuilder('fase')
        .select('MAX(fase.ordine)', 'max')
        .getRawOne();
      dto.ordine = (maxOrdine?.max || 0) + 1;
    }

    const fase = this.repo.create(dto);
    return this.repo.save(fase);
  }

  /**
   * Aggiorna una fase esistente.
   */
  async update(id: string, dto: UpdateFaseDto): Promise<Fase> {
    const fase = await this.findOne(id);

    // Se sta cambiando codice, verifica unicità
    if (dto.codice && dto.codice !== fase.codice) {
      const existing = await this.findByCodice(dto.codice);
      if (existing) {
        throw new ConflictException(
          `Esiste già una fase con codice "${dto.codice}"`,
        );
      }
    }

    Object.assign(fase, dto);
    return this.repo.save(fase);
  }

  /**
   * Disattiva una fase (soft-delete).
   */
  async deactivate(id: string): Promise<Fase> {
    const fase = await this.findOne(id);
    await this.repo.update({ id }, { attivo: false });
    return { ...fase, attivo: false };
  }

  /**
   * Riattiva una fase.
   */
  async reactivate(id: string): Promise<Fase> {
    const fase = await this.findOne(id);
    await this.repo.update({ id }, { attivo: true });
    return { ...fase, attivo: true };
  }

  /**
   * Elimina fisicamente una fase.
   * ATTENZIONE: Verificare che non sia usata da pratiche.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // TODO: Verificare che non ci siano pratiche con questa fase
    await this.repo.delete({ id });
  }

  /**
   * Riordina le fasi.
   * @param orderedIds - Array di ID nell'ordine desiderato
   */
  async reorder(orderedIds: string[]): Promise<Fase[]> {
    const updates = orderedIds.map((id, index) =>
      this.repo.update({ id }, { ordine: index + 1 }),
    );
    await Promise.all(updates);
    return this.findAll();
  }

  /**
   * Inizializza le fasi di default se la tabella è vuota.
   */
  async initializeDefaults(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    const fasiDefault: CreateFaseDto[] = [
      {
        nome: 'Analisi preliminare',
        codice: 'analisi_preliminare',
        descrizione: 'Fase iniziale di analisi del credito e della documentazione',
        ordine: 1,
        colore: '#6366F1', // indigo
        icona: 'FileSearch',
        isFaseChiusura: false,
      },
      {
        nome: 'Messa in mora',
        codice: 'messa_in_mora',
        descrizione: 'Invio della diffida di pagamento al debitore',
        ordine: 2,
        colore: '#F59E0B', // amber
        icona: 'Mail',
        isFaseChiusura: false,
      },
      {
        nome: 'Decreto ingiuntivo',
        codice: 'decreto_ingiuntivo',
        descrizione: 'Richiesta di decreto ingiuntivo al tribunale',
        ordine: 3,
        colore: '#8B5CF6', // violet
        icona: 'Gavel',
        isFaseChiusura: false,
      },
      {
        nome: 'Esecuzione forzata',
        codice: 'esecuzione_forzata',
        descrizione: 'Avvio delle procedure esecutive',
        ordine: 4,
        colore: '#EF4444', // red
        icona: 'AlertTriangle',
        isFaseChiusura: false,
      },
      {
        nome: 'Pignoramento',
        codice: 'pignoramento',
        descrizione: 'Pignoramento dei beni del debitore',
        ordine: 5,
        colore: '#DC2626', // red-600
        icona: 'Lock',
        isFaseChiusura: false,
      },
      {
        nome: 'Chiusa',
        codice: 'chiusa',
        descrizione: 'Pratica conclusa (positivamente o negativamente)',
        ordine: 99,
        colore: '#10B981', // emerald
        icona: 'CheckCircle',
        isFaseChiusura: true,
      },
    ];

    for (const fase of fasiDefault) {
      await this.create(fase);
    }
  }
}