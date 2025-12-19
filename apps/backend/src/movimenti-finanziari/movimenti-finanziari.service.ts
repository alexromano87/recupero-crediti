// apps/backend/src/movimenti-finanziari/movimenti-finanziari.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimentoFinanziario } from './movimento-finanziario.entity';
import { CreateMovimentoFinanziarioDto } from './create-movimento-finanziario.dto';
import { UpdateMovimentoFinanziarioDto } from './update-movimento-finanziario.dto';

@Injectable()
export class MovimentiFinanziariService {
  constructor(
    @InjectRepository(MovimentoFinanziario)
    private movimentiRepository: Repository<MovimentoFinanziario>,
  ) {}

  async create(createMovimentoDto: CreateMovimentoFinanziarioDto): Promise<MovimentoFinanziario> {
    const movimento = this.movimentiRepository.create(createMovimentoDto);
    return await this.movimentiRepository.save(movimento);
  }

  async findAllByPratica(praticaId: string, studioId?: string): Promise<MovimentoFinanziario[]> {
    const where: any = { praticaId };

    // Se studioId è definito, filtra per studio
    if (studioId !== undefined) {
      where.studioId = studioId;
    }

    return await this.movimentiRepository.find({
      where,
      order: { data: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MovimentoFinanziario> {
    const movimento = await this.movimentiRepository.findOne({
      where: { id },
    });
    if (!movimento) {
      throw new NotFoundException(`Movimento con id ${id} non trovato`);
    }
    return movimento;
  }

  async update(id: string, updateMovimentoDto: UpdateMovimentoFinanziarioDto): Promise<MovimentoFinanziario> {
    const movimento = await this.findOne(id);
    Object.assign(movimento, updateMovimentoDto);
    return await this.movimentiRepository.save(movimento);
  }

  async remove(id: string): Promise<void> {
    const movimento = await this.findOne(id);
    await this.movimentiRepository.remove(movimento);
  }

  // Metodo helper per calcolare totali per tipo
  async getTotaliByPratica(praticaId: string, studioId?: string) {
    const movimenti = await this.findAllByPratica(praticaId, studioId);

    const totali = {
      capitale: 0,
      anticipazioni: 0,
      compensi: 0,
      interessi: 0,
      recuperoCapitale: 0,
      recuperoAnticipazioni: 0,
      recuperoCompensi: 0,
      recuperoInteressi: 0,
    };

    movimenti.forEach((m) => {
      const importo = Number(m.importo);
      switch (m.tipo) {
        case 'capitale':
          totali.capitale += importo;
          break;
        case 'anticipazione':
          totali.anticipazioni += importo;
          break;
        case 'compenso':
          totali.compensi += importo;
          break;
        case 'interessi':
          totali.interessi += importo;
          break;
        case 'recupero_capitale':
          totali.recuperoCapitale += importo;
          break;
        case 'recupero_anticipazione':
          totali.recuperoAnticipazioni += importo;
          break;
        case 'recupero_compenso':
          totali.recuperoCompensi += importo;
          break;
        case 'recupero_interessi':
          totali.recuperoInteressi += importo;
          break;
      }
    });

    return totali;
  }
}
