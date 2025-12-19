// src/pratiche/pratiche.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PraticheService } from './pratiche.service';
import { CreatePraticaDto } from './dto/create-pratica.dto';
import { UpdatePraticaDto } from './dto/update-pratica.dto';
import { CambiaFaseDto } from './dto/cambia-fase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('pratiche')
@UseGuards(JwtAuthGuard)
export class PraticheController {
  constructor(private readonly praticheService: PraticheService) {}

  // ====== CRUD BASE PRATICHE ======

  // GET /pratiche -> lista pratiche
  // Query params:
  //   ?includeInactive=true per includere le disattivate
  //   ?clienteId=xxx per filtrare per cliente
  //   ?debitoreId=xxx per filtrare per debitore
  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive') includeInactive?: string,
    @Query('clienteId') clienteId?: string,
    @Query('debitoreId') debitoreId?: string,
  ) {
    const includeInact = includeInactive === 'true';

    // Gli admin vedono tutte le pratiche
    // Gli altri vedono solo le pratiche del loro studio
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;

    if (clienteId) {
      return this.praticheService.findByCliente(clienteId, includeInact);
    }
    if (debitoreId) {
      return this.praticheService.findByDebitore(debitoreId, includeInact);
    }

    return this.praticheService.findAll(includeInact, studioId);
  }

  // GET /pratiche/stats -> statistiche pratiche
  @Get('stats')
  async getStats() {
    const [countByStato, totaliFinanziari, countByFase] = await Promise.all([
      this.praticheService.countByStato(),
      this.praticheService.calcolaTotaliFinanziari(),
      this.praticheService.countByFase(),
    ]);

    return {
      ...countByStato,
      ...totaliFinanziari,
      perFase: countByFase,
    };
  }

  // GET /pratiche/:id -> dettaglio singola pratica
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.praticheService.findOne(id);
  }

  // POST /pratiche -> creazione nuova pratica
  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePraticaDto) {
    // Assegna automaticamente lo studioId dell'utente loggato (se non è admin)
    if (user.ruolo !== 'admin' && user.studioId) {
      dto.studioId = user.studioId;
    }
    return this.praticheService.create(dto);
  }

  // PUT /pratiche/:id -> aggiornamento pratica
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePraticaDto) {
    return this.praticheService.update(id, dto);
  }

  // ====== GESTIONE FASI ======

  // PATCH /pratiche/:id/fase -> cambia fase
  @Patch(':id/fase')
  cambiaFase(@Param('id') id: string, @Body() dto: CambiaFaseDto) {
    return this.praticheService.cambiaFase(id, dto);
  }

  // PATCH /pratiche/:id/riapri -> riapre una pratica chiusa
  @Patch(':id/riapri')
  riapri(
    @Param('id') id: string,
    @Body() body: { faseId?: string },
  ) {
    return this.praticheService.riapri(id, body?.faseId);
  }

  // ====== SOFT DELETE ======

  // PATCH /pratiche/:id/deactivate -> disattiva pratica
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.praticheService.deactivate(id);
  }

  // PATCH /pratiche/:id/reactivate -> riattiva pratica
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.praticheService.reactivate(id);
  }

  // DELETE /pratiche/:id -> eliminazione fisica
  // ATTENZIONE: preferire deactivate
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.praticheService.remove(id);
  }
}