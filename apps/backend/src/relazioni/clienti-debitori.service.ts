// src/relazioni/clienti-debitori.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteDebitore } from './cliente-debitore.entity';
import { Debitore } from '../debitori/debitore.entity';

@Injectable()
export class ClientiDebitoriService {
  constructor(
    @InjectRepository(ClienteDebitore)
    private readonly cdRepo: Repository<ClienteDebitore>,
    @InjectRepository(Debitore)
    private readonly debitoriRepo: Repository<Debitore>,
  ) {}

  async getDebitoriByCliente(clienteId: string): Promise<Debitore[]> {
    const links = await this.cdRepo.find({
      where: { clienteId, attivo: true },
      relations: ['debitore'],
    });

    return links.map((l) => l.debitore);
  }

  async setDebitoriForCliente(
    clienteId: string,
    debitoriIds: string[],
  ): Promise<void> {
    // disattivo (soft) tutti quelli esistenti
    await this.cdRepo.update({ clienteId }, { attivo: false });

    if (!debitoriIds || debitoriIds.length === 0) {
      return;
    }

    // riattivo o creo i link necessari
    const existing = await this.cdRepo.find({
      where: { clienteId, debitoreId: In(debitoriIds) },
    });

    const existingMap = new Map(
      existing.map((l) => [l.debitoreId, l]),
    );

    const toSave: ClienteDebitore[] = [];

    for (const debitoreId of debitoriIds) {
      const found = existingMap.get(debitoreId);
      if (found) {
        found.attivo = true;
        toSave.push(found);
      } else {
        toSave.push(
          this.cdRepo.create({
            clienteId,
            debitoreId,
            attivo: true,
          }),
        );
      }
    }

    await this.cdRepo.save(toSave);
  }

  async unlinkDebitoreFromCliente(
    clienteId: string,
    debitoreId: string,
  ): Promise<void> {
    await this.cdRepo.update({ clienteId, debitoreId }, { attivo: false });
  }
}
