import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientiService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repo: Repository<Cliente>,
  ) {}

  async create(data: CreateClienteDto) {
    // Verifica duplicati per P.IVA
    if (data.partitaIva) {
      const existing = await this.repo.findOne({
        where: { partitaIva: data.partitaIva },
      });
      if (existing) {
        throw new ConflictException(
          'Esiste già un cliente con questa Partita IVA',
        );
      }
    }

    const cliente = this.repo.create(data);
    return this.repo.save(cliente);
  }

  /**
   * Restituisce tutti i clienti.
   * @param includeInactive - se true, include anche i clienti disattivati
   */
  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { attivo: true };
    return this.repo.find({
      where,
      order: { ragioneSociale: 'ASC' },
    });
  }

  async findOne(id: string) {
    const cliente = await this.repo.findOne({
      where: { id },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} non trovato`);
    }
    return cliente;
  }

  async update(id: string, data: UpdateClienteDto) {
    const cliente = await this.findOne(id);

    // Se sta cambiando P.IVA, verifica duplicati
    if (data.partitaIva && data.partitaIva !== cliente.partitaIva) {
      const existing = await this.repo.findOne({
        where: { partitaIva: data.partitaIva },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Esiste già un cliente con questa Partita IVA',
        );
      }
    }

    await this.repo.update({ id }, data);
    return this.findOne(id);
  }

  /**
   * Disattiva un cliente (soft-delete).
   * Non elimina fisicamente il record.
   */
  async deactivate(id: string) {
    const cliente = await this.findOne(id);

    // TODO: Quando avremo le Pratiche, verificare qui che non ci siano pratiche aperte
    // const praticheAperte = await this.praticheRepo.count({
    //   where: { clienteId: id, stato: Not('chiusa') }
    // });
    // if (praticheAperte > 0) {
    //   throw new ConflictException(
    //     `Impossibile disattivare: il cliente ha ${praticheAperte} pratiche aperte`
    //   );
    // }

    await this.repo.update({ id }, { attivo: false });
    return { ...cliente, attivo: false };
  }

  /**
   * Riattiva un cliente precedentemente disattivato.
   */
  async reactivate(id: string) {
    const cliente = await this.findOne(id);
    await this.repo.update({ id }, { attivo: true });
    return { ...cliente, attivo: true };
  }

  /**
   * Elimina fisicamente un cliente.
   * ATTENZIONE: Usare solo se non ci sono relazioni.
   * Preferire deactivate() nella maggior parte dei casi.
   */
  async remove(id: string) {
    const cliente = await this.findOne(id);

    // TODO: Quando avremo le Pratiche, bloccare se ci sono pratiche collegate
    // const praticheCollegate = await this.praticheRepo.count({
    //   where: { clienteId: id }
    // });
    // if (praticheCollegate > 0) {
    //   throw new ConflictException(
    //     `Impossibile eliminare: il cliente è collegato a ${praticheCollegate} pratiche`
    //   );
    // }

    await this.repo.delete({ id });
    return cliente;
  }

  /**
   * Conta le pratiche collegate a un cliente.
   * Per ora ritorna 0, verrà implementato quando avremo l'entity Pratica.
   */
  async countPraticheCollegate(id: string): Promise<number> {
    // TODO: Implementare quando avremo l'entity Pratica
    return 0;
  }
}