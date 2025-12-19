// src/pratiche/pratiche.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pratica, StoricoFase } from './pratica.entity';
import { Avvocato } from '../avvocati/avvocato.entity';
import { CreatePraticaDto } from './dto/create-pratica.dto';
import { UpdatePraticaDto } from './dto/update-pratica.dto';
import { CambiaFaseDto } from './dto/cambia-fase.dto';
import { FasiService } from '../fasi/fasi.service';

@Injectable()
export class PraticheService {
  constructor(
    @InjectRepository(Pratica)
    private readonly repo: Repository<Pratica>,
    @InjectRepository(Avvocato)
    private readonly avvocatiRepo: Repository<Avvocato>,
    private readonly fasiService: FasiService,
  ) {}

  /**
   * Restituisce tutte le pratiche.
   * @param includeInactive - se true, include anche le pratiche disattivate
   * @param studioId - se fornito, filtra per studio
   */
  async findAll(includeInactive = false, studioId?: string): Promise<Pratica[]> {
    const where: any = includeInactive ? {} : { attivo: true };

    // Se studioId è fornito, filtra per studio
    if (studioId) {
      where.studioId = studioId;
    }

    return this.repo.find({
      where,
      relations: ['cliente', 'debitore', 'avvocati', 'movimentiFinanziari', 'studio'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Restituisce le pratiche di un cliente specifico.
   */
  async findByCliente(
    clienteId: string,
    includeInactive = false,
  ): Promise<Pratica[]> {
    const where = includeInactive
      ? { clienteId }
      : { clienteId, attivo: true };
    return this.repo.find({
      where,
      relations: ['cliente', 'debitore', 'avvocati', 'movimentiFinanziari'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Restituisce le pratiche di un debitore specifico.
   */
  async findByDebitore(
    debitoreId: string,
    includeInactive = false,
  ): Promise<Pratica[]> {
    const where = includeInactive
      ? { debitoreId }
      : { debitoreId, attivo: true };
    return this.repo.find({
      where,
      relations: ['cliente', 'debitore', 'avvocati', 'movimentiFinanziari'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Restituisce una pratica specifica.
   */
  async findOne(id: string): Promise<Pratica> {
    const pratica = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'debitore', 'avvocati', 'movimentiFinanziari'],
    });
    if (!pratica) {
      throw new NotFoundException(`Pratica con ID ${id} non trovata`);
    }
    return pratica;
  }

  /**
   * Crea una nuova pratica.
   */
  async create(dto: CreatePraticaDto): Promise<Pratica> {
    // Determina la fase iniziale
    let faseIniziale;
    if (dto.faseId) {
      faseIniziale = this.fasiService.findOne(dto.faseId);
    } else {
      // Prendi la prima fase (ordine più basso, non di chiusura)
      const fasi = this.fasiService.findAll();
      faseIniziale = fasi.find((f) => !f.isFaseChiusura);
      if (!faseIniziale) {
        throw new BadRequestException(
          'Nessuna fase disponibile.',
        );
      }
    }

    // Inizializza lo storico con la fase iniziale
    const storico: StoricoFase[] = [
      {
        faseId: faseIniziale.id,
        faseCodice: faseIniziale.codice,
        faseNome: faseIniziale.nome,
        dataInizio: new Date().toISOString(),
      },
    ];

    // Carica avvocati se specificati
    let avvocati: Avvocato[] = [];
    if (dto.avvocatiIds && dto.avvocatiIds.length > 0) {
      avvocati = await this.avvocatiRepo.find({
        where: { id: In(dto.avvocatiIds) },
      });
      if (avvocati.length !== dto.avvocatiIds.length) {
        throw new BadRequestException('Uno o più avvocati non trovati');
      }
    }

    const { avvocatiIds, ...dtoWithoutAvvocati } = dto;

    const pratica = this.repo.create({
      ...dtoWithoutAvvocati,
      faseId: faseIniziale.id,
      aperta: dto.aperta !== undefined ? dto.aperta : true,
      storico,
      avvocati,
      dataAffidamento: dto.dataAffidamento
        ? new Date(dto.dataAffidamento)
        : new Date(),
      dataChiusura: dto.dataChiusura ? new Date(dto.dataChiusura) : undefined,
      dataScadenza: dto.dataScadenza ? new Date(dto.dataScadenza) : undefined,
    });

    const saved = await this.repo.save(pratica);
    return this.findOne(saved.id);
  }

  /**
   * Aggiorna una pratica esistente.
   */
  async update(id: string, dto: UpdatePraticaDto): Promise<Pratica> {
    const pratica = await this.findOne(id);

    // Se sta cambiando la fase, usa il metodo apposito
    if (dto.faseId && dto.faseId !== pratica.faseId) {
      throw new BadRequestException(
        'Per cambiare fase usa l\'endpoint PATCH /pratiche/:id/fase',
      );
    }

    // Se imposta esito, chiudi la pratica
    if (dto.esito && dto.esito !== pratica.esito) {
      pratica.aperta = false;
      pratica.esito = dto.esito;
      pratica.dataChiusura = new Date();
    }

    // Gestisci aggiornamento avvocati
    if (dto.avvocatiIds !== undefined) {
      if (dto.avvocatiIds.length > 0) {
        const avvocati = await this.avvocatiRepo.find({
          where: { id: In(dto.avvocatiIds) },
        });
        if (avvocati.length !== dto.avvocatiIds.length) {
          throw new BadRequestException('Uno o più avvocati non trovati');
        }
        pratica.avvocati = avvocati;
      } else {
        pratica.avvocati = [];
      }
    }

    const { avvocatiIds, ...dtoWithoutAvvocati } = dto;

    // Aggiorna i campi
    Object.assign(pratica, {
      ...dtoWithoutAvvocati,
      dataAffidamento: dto.dataAffidamento
        ? new Date(dto.dataAffidamento)
        : pratica.dataAffidamento,
      dataChiusura: dto.dataChiusura
        ? new Date(dto.dataChiusura)
        : pratica.dataChiusura,
      dataScadenza: dto.dataScadenza
        ? new Date(dto.dataScadenza)
        : pratica.dataScadenza,
    });

    await this.repo.save(pratica);
    return this.findOne(id);
  }

  /**
   * Cambia la fase di una pratica e aggiorna lo storico.
   */
  async cambiaFase(id: string, dto: CambiaFaseDto): Promise<Pratica> {
    const pratica = await this.findOne(id);
    const nuovaFase = this.fasiService.findOne(dto.nuovaFaseId);

    if (!pratica.aperta && !nuovaFase.isFaseChiusura) {
      throw new BadRequestException(
        'Non puoi cambiare fase a una pratica chiusa. Riapri prima la pratica.',
      );
    }

    if (pratica.faseId === dto.nuovaFaseId) {
      throw new BadRequestException(
        `La pratica è già nella fase "${nuovaFase.nome}"`,
      );
    }

    const now = new Date().toISOString();

    // Chiudi la fase corrente nello storico
    const storico = pratica.storico || [];
    if (storico.length > 0) {
      const faseCorrente = storico[storico.length - 1];
      if (!faseCorrente.dataFine) {
        faseCorrente.dataFine = now;
      }
    }

    // Aggiungi la nuova fase
    storico.push({
      faseId: nuovaFase.id,
      faseCodice: nuovaFase.codice,
      faseNome: nuovaFase.nome,
      dataInizio: now,
      note: dto.note,
    });

    pratica.faseId = nuovaFase.id;
    pratica.storico = storico;

    // Se la nuova fase è di chiusura, chiudi la pratica
    // Determina l'esito in base al codice della fase
    if (nuovaFase.isFaseChiusura) {
      pratica.aperta = false;
      pratica.dataChiusura = new Date();
      
      // Determina esito dal codice fase o dal dto
      if (nuovaFase.codice === 'chiusura_positiva') {
        pratica.esito = 'positivo';
      } else if (nuovaFase.codice === 'chiusura_negativa') {
        pratica.esito = 'negativo';
      } else if (dto.esito) {
        pratica.esito = dto.esito;
      } else {
        throw new BadRequestException(
          'Per chiudere la pratica devi specificare un esito (positivo/negativo)',
        );
      }
    }

    await this.repo.save(pratica);
    return this.findOne(id);
  }

  /**
   * Riapre una pratica chiusa.
   */
  async riapri(id: string, nuovaFaseId?: string): Promise<Pratica> {
    const pratica = await this.findOne(id);

    if (pratica.aperta) {
      throw new BadRequestException('La pratica è già aperta');
    }

    // Determina la nuova fase
    let nuovaFase;
    if (nuovaFaseId) {
      nuovaFase = this.fasiService.findOne(nuovaFaseId);
    } else {
      // Prendi la prima fase (ordine più basso, non di chiusura)
      const fasi = await this.fasiService.findAll();
      nuovaFase = fasi.find((f) => !f.isFaseChiusura);
      if (!nuovaFase) {
        throw new BadRequestException('Nessuna fase disponibile');
      }
    }

    const now = new Date().toISOString();
    const storico = pratica.storico || [];

    // Chiudi la fase corrente nello storico
    if (storico.length > 0) {
      const faseCorrente = storico[storico.length - 1];
      if (!faseCorrente.dataFine) {
        faseCorrente.dataFine = now;
      }
    }

    // Aggiungi la nuova fase
    storico.push({
      faseId: nuovaFase.id,
      faseCodice: nuovaFase.codice,
      faseNome: nuovaFase.nome,
      dataInizio: now,
      note: 'Pratica riaperta',
    });

    pratica.aperta = true;
    pratica.esito = null;
    pratica.faseId = nuovaFase.id;
    pratica.storico = storico;
    pratica.dataChiusura = undefined;

    await this.repo.save(pratica);
    return this.findOne(id);
  }

  /**
   * Disattiva una pratica (soft-delete).
   */
  async deactivate(id: string): Promise<Pratica> {
    const pratica = await this.findOne(id);
    await this.repo.update({ id }, { attivo: false });
    return this.findOne(id);
  }

  /**
   * Riattiva una pratica precedentemente disattivata.
   */
  async reactivate(id: string): Promise<Pratica> {
    const pratica = await this.findOne(id);
    await this.repo.update({ id }, { attivo: true });
    return this.findOne(id);
  }

  /**
   * Elimina fisicamente una pratica.
   * ATTENZIONE: Usare solo se necessario.
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verifica esistenza
    await this.repo.delete({ id });
  }

  /**
   * Conta le pratiche per stato.
   */
  async countByStato(): Promise<{
    aperte: number;
    chiusePositive: number;
    chiuseNegative: number;
    totali: number;
  }> {
    const [aperte, chiusePositive, chiuseNegative, totali] = await Promise.all([
      this.repo.count({ where: { aperta: true, attivo: true } }),
      this.repo.count({
        where: { aperta: false, esito: 'positivo', attivo: true },
      }),
      this.repo.count({
        where: { aperta: false, esito: 'negativo', attivo: true },
      }),
      this.repo.count({ where: { attivo: true } }),
    ]);

    return { aperte, chiusePositive, chiuseNegative, totali };
  }

  /**
   * Calcola i totali finanziari.
   */
  async calcolaTotaliFinanziari(): Promise<{
    capitaleAffidato: number;
    capitaleRecuperato: number;
    capitaleDaRecuperare: number;
    anticipazioni: number;
    anticipazioniRecuperate: number;
    compensiMaturati: number;
    compensiLiquidati: number;
  }> {
    const result = await this.repo
      .createQueryBuilder('pratica')
      .select([
        'SUM(pratica.capitale) as capitaleAffidato',
        'SUM(pratica.importoRecuperatoCapitale) as capitaleRecuperato',
        'SUM(pratica.anticipazioni) as anticipazioni',
        'SUM(pratica.importoRecuperatoAnticipazioni) as anticipazioniRecuperate',
        'SUM(pratica.compensiLegali) as compensiMaturati',
        'SUM(pratica.compensiLiquidati) as compensiLiquidati',
      ])
      .where('pratica.attivo = :attivo', { attivo: true })
      .getRawOne();

    const capitaleAffidato = parseFloat(result.capitaleAffidato) || 0;
    const capitaleRecuperato = parseFloat(result.capitaleRecuperato) || 0;

    return {
      capitaleAffidato,
      capitaleRecuperato,
      capitaleDaRecuperare: capitaleAffidato - capitaleRecuperato,
      anticipazioni: parseFloat(result.anticipazioni) || 0,
      anticipazioniRecuperate: parseFloat(result.anticipazioniRecuperate) || 0,
      compensiMaturati: parseFloat(result.compensiMaturati) || 0,
      compensiLiquidati: parseFloat(result.compensiLiquidati) || 0,
    };
  }

  /**
   * Conta pratiche per fase.
   */
  async countByFase(): Promise<Record<string, number>> {
    const results = await this.repo
      .createQueryBuilder('pratica')
      .select('pratica.faseId', 'faseId')
      .addSelect('COUNT(*)', 'count')
      .where('pratica.attivo = :attivo', { attivo: true })
      .groupBy('pratica.faseId')
      .getRawMany();

    const counts: Record<string, number> = {};
    results.forEach((r) => {
      // Usa la costante per ottenere il codice dalla faseId
      const fase = this.fasiService.findOne(r.faseId);
      if (fase) {
        counts[fase.codice] = parseInt(r.count, 10);
      }
    });

    return counts;
  }
}