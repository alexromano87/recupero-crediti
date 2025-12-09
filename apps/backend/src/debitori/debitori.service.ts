// src/debitori/debitori.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * Restituisce tutti i debitori.
   * @param includeInactive - se true, include anche i debitori disattivati
   */
  async findAll(includeInactive = false): Promise<Debitore[]> {
    const where = includeInactive ? {} : { attivo: true };
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Restituisce tutti i debitori con il conteggio dei clienti collegati.
   * Utile per la pagina di ricerca per mostrare se un debitore è "orfano".
   */
  async findAllWithClientiCount(
    includeInactive = false,
  ): Promise<(Debitore & { clientiCount: number })[]> {
    const where = includeInactive ? {} : { attivo: true };
    const debitori = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Per ogni debitore, conta i clienti collegati
    const results = await Promise.all(
      debitori.map(async (d) => {
        const clientiIds =
          await this.clientiDebitoriService.getClientiByDebitore(d.id);
        return {
          ...d,
          clientiCount: clientiIds.length,
        };
      }),
    );

    return results;
  }

  async findOne(id: string): Promise<Debitore> {
    const debitore = await this.repo.findOne({ where: { id } });
    if (!debitore) {
      throw new NotFoundException(`Debitore con ID ${id} non trovato`);
    }
    return debitore;
  }

  async create(dto: CreateDebitoreDto): Promise<Debitore> {
    const { clientiIds, ...rest } = dto;

    // Verifica duplicati per Codice Fiscale
    if (rest.codiceFiscale) {
      const existing = await this.repo.findOne({
        where: { codiceFiscale: rest.codiceFiscale },
      });
      if (existing) {
        throw new ConflictException(
          'Esiste già un debitore con questo Codice Fiscale',
        );
      }
    }

    const debitore = this.repo.create({
      ...rest,
      dataNascita: rest.dataNascita ? new Date(rest.dataNascita) : undefined,
    });

    const saved = await this.repo.save(debitore);

    // Collega ai clienti se specificati
    if (clientiIds && clientiIds.length > 0) {
      for (const clienteId of clientiIds) {
        await this.clientiDebitoriService.linkDebitoreToCliente(
          clienteId,
          saved.id,
        );
      }
    }

    return saved;
  }

  async update(id: string, dto: UpdateDebitoreDto): Promise<Debitore> {
    const debitore = await this.findOne(id);
    const { clientiIds, ...rest } = dto;

    // Se sta cambiando CF, verifica duplicati
    if (rest.codiceFiscale && rest.codiceFiscale !== debitore.codiceFiscale) {
      const existing = await this.repo.findOne({
        where: { codiceFiscale: rest.codiceFiscale },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Esiste già un debitore con questo Codice Fiscale',
        );
      }
    }

    await this.repo.update(
      { id },
      {
        ...rest,
        dataNascita: rest.dataNascita ? new Date(rest.dataNascita) : undefined,
      },
    );

    // Gestione clientiIds se specificati (opzionale)
    // Per ora lasciamo la gestione dei link a /clienti/:id/debitori

    return this.findOne(id);
  }

  /**
   * Disattiva un debitore (soft-delete).
   */
  async deactivate(id: string): Promise<Debitore> {
    const debitore = await this.findOne(id);

    // TODO: Quando avremo le Pratiche, verificare che non ci siano pratiche aperte
    // const praticheAperte = await this.praticheRepo.count({
    //   where: { debitoreId: id, stato: Not('chiusa') }
    // });
    // if (praticheAperte > 0) {
    //   throw new ConflictException(
    //     `Impossibile disattivare: il debitore ha ${praticheAperte} pratiche aperte`
    //   );
    // }

    await this.repo.update({ id }, { attivo: false });
    return { ...debitore, attivo: false };
  }

  /**
   * Riattiva un debitore precedentemente disattivato.
   */
  async reactivate(id: string): Promise<Debitore> {
    const debitore = await this.findOne(id);
    await this.repo.update({ id }, { attivo: true });
    return { ...debitore, attivo: true };
  }

  /**
   * Elimina fisicamente un debitore.
   * ATTENZIONE: Usare solo se non ci sono relazioni.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verifica esistenza

    // TODO: Quando avremo le Pratiche, bloccare se ci sono pratiche collegate
    // const praticheCollegate = await this.praticheRepo.count({
    //   where: { debitoreId: id }
    // });
    // if (praticheCollegate > 0) {
    //   throw new ConflictException(
    //     `Impossibile eliminare: il debitore è collegato a ${praticheCollegate} pratiche`
    //   );
    // }

    await this.repo.delete({ id });
  }

  /**
   * Conta le pratiche collegate a un debitore.
   * Per ora ritorna 0, verrà implementato quando avremo l'entity Pratica.
   */
  async countPraticheCollegate(id: string): Promise<number> {
    // TODO: Implementare quando avremo l'entity Pratica
    return 0;
  }
}