import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './studio.entity';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';

@Injectable()
export class StudiService {
  constructor(
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
  ) {}

  async findAll(): Promise<Studio[]> {
    return this.studioRepository.find({
      order: { nome: 'ASC' },
      relations: ['users', 'pratiche'],
    });
  }

  async findAllActive(): Promise<Studio[]> {
    return this.studioRepository.find({
      where: { attivo: true },
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Studio> {
    const studio = await this.studioRepository.findOne({
      where: { id },
      relations: ['users', 'pratiche'],
    });

    if (!studio) {
      throw new NotFoundException('Studio non trovato');
    }

    return studio;
  }

  async create(createStudioDto: CreateStudioDto): Promise<Studio> {
    // Verifica se esiste già uno studio con lo stesso nome
    const existingStudio = await this.studioRepository.findOne({
      where: { nome: createStudioDto.nome },
    });

    if (existingStudio) {
      throw new ConflictException('Esiste già uno studio con questo nome');
    }

    const studio = this.studioRepository.create(createStudioDto);
    return this.studioRepository.save(studio);
  }

  async update(id: string, updateStudioDto: UpdateStudioDto): Promise<Studio> {
    const studio = await this.findOne(id);

    // Se viene aggiornato il nome, verifica che non sia già in uso
    if (updateStudioDto.nome && updateStudioDto.nome !== studio.nome) {
      const existingStudio = await this.studioRepository.findOne({
        where: { nome: updateStudioDto.nome },
      });

      if (existingStudio) {
        throw new ConflictException('Esiste già uno studio con questo nome');
      }
    }

    Object.assign(studio, updateStudioDto);
    return this.studioRepository.save(studio);
  }

  async remove(id: string): Promise<void> {
    const studio = await this.findOne(id);

    // Verifica se ci sono utenti associati
    if (studio.users && studio.users.length > 0) {
      throw new ConflictException(
        'Non è possibile eliminare uno studio con utenti associati',
      );
    }

    await this.studioRepository.remove(studio);
  }

  async toggleActive(id: string): Promise<Studio> {
    const studio = await this.findOne(id);
    studio.attivo = !studio.attivo;
    return this.studioRepository.save(studio);
  }

  async getStudioStats(id: string) {
    const studio = await this.studioRepository
      .createQueryBuilder('studio')
      .leftJoinAndSelect('studio.users', 'user')
      .leftJoinAndSelect('studio.pratiche', 'pratica', 'pratica.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.clienti', 'cliente', 'cliente.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.debitori', 'debitore', 'debitore.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.avvocati', 'avvocato', 'avvocato.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.documenti', 'documento', 'documento.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.tickets', 'ticket', 'ticket.attivo = :attivo', { attivo: true })
      .leftJoinAndSelect('studio.alerts', 'alert', 'alert.attivo = :attivo', { attivo: true })
      .where('studio.id = :id', { id })
      .getOne();

    if (!studio) {
      throw new NotFoundException('Studio non trovato');
    }

    // Calcola statistiche pratiche
    const praticheAperte = studio.pratiche?.filter(p => p.aperta).length || 0;
    const praticheChiuse = studio.pratiche?.filter(p => !p.aperta).length || 0;

    // Calcola totali finanziari
    const capitaleAffidato = studio.pratiche?.reduce((sum, p) => sum + (p.capitale || 0), 0) || 0;
    const capitaleRecuperato = studio.pratiche?.reduce((sum, p) => sum + (p.importoRecuperatoCapitale || 0), 0) || 0;

    // Calcola spazio storage utilizzato (in MB)
    const storageUtilizzato = studio.documenti?.reduce((sum, d) => sum + (d.dimensione || 0), 0) || 0;
    const storageUtilizzatoMB = (storageUtilizzato / 1024 / 1024).toFixed(2);

    // Utenti per ruolo
    const utentiPerRuolo = studio.users?.reduce((acc, user) => {
      acc[user.ruolo] = (acc[user.ruolo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Alerts aperti
    const alertsAperti = studio.alerts?.filter(a => a.stato === 'in_gestione').length || 0;

    // Tickets aperti
    const ticketsAperti = studio.tickets?.filter(t => t.stato === 'aperto' || t.stato === 'in_gestione').length || 0;

    return {
      studio: {
        id: studio.id,
        nome: studio.nome,
        ragioneSociale: studio.ragioneSociale,
        email: studio.email,
        telefono: studio.telefono,
        attivo: studio.attivo,
        createdAt: studio.createdAt,
        updatedAt: studio.updatedAt,
      },
      statistiche: {
        numeroUtenti: studio.users?.length || 0,
        utentiAttivi: studio.users?.filter(u => u.attivo).length || 0,
        utentiPerRuolo,
        numeroPratiche: studio.pratiche?.length || 0,
        praticheAperte,
        praticheChiuse,
        numeroClienti: studio.clienti?.length || 0,
        numeroDebitori: studio.debitori?.length || 0,
        numeroAvvocati: studio.avvocati?.length || 0,
        numeroDocumenti: studio.documenti?.length || 0,
        storageUtilizzatoMB: parseFloat(storageUtilizzatoMB),
        alertsAperti,
        ticketsAperti,
      },
      finanziari: {
        capitaleAffidato,
        capitaleRecuperato,
        percentualeRecupero: capitaleAffidato > 0 ? ((capitaleRecuperato / capitaleAffidato) * 100).toFixed(2) : '0.00',
      },
    };
  }
}
