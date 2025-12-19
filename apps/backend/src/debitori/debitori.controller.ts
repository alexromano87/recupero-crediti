// apps/backend/src/debitori/debitori.controller.ts
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
import { DebitoriService } from './debitori.service';
import { CreateDebitoreDto } from './dto/create-debitore.dto';
import { UpdateDebitoreDto } from './dto/update-debitore.dto';
import { ClientiDebitoriService } from '../relazioni/clienti-debitori.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('debitori')
@UseGuards(JwtAuthGuard)
export class DebitoriController {
  constructor(
    private readonly debitoriService: DebitoriService,
    private readonly clientiDebitoriService: ClientiDebitoriService,
  ) {}

  // GET /debitori -> lista debitori
  // Query param: ?includeInactive=true per includere i disattivati
  // Query param: ?withClientiCount=true per includere il conteggio clienti collegati
  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive') includeInactive?: string,
    @Query('withClientiCount') withClientiCount?: string,
  ) {
    const includeInact = includeInactive === 'true';
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;

    if (withClientiCount === 'true') {
      return this.debitoriService.findAllWithClientiCount(includeInact, studioId);
    }
    return this.debitoriService.findAll(includeInact, studioId);
  }

  // GET /debitori/:id -> dettaglio singolo debitore
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debitoriService.findOne(id);
  }

  // GET /debitori/:id/clienti -> lista clienti collegati al debitore
  @Get(':id/clienti')
  async getClientiForDebitore(@Param('id') id: string) {
    const clientiIds = await this.clientiDebitoriService.getClientiByDebitore(id);
    return { clientiIds };
  }

  // GET /debitori/:id/pratiche-count -> conta pratiche collegate
  @Get(':id/pratiche-count')
  async getPraticheCount(@Param('id') id: string) {
    const count = await this.debitoriService.countPraticheCollegate(id);
    return { count };
  }

  // POST /debitori -> creazione nuovo debitore
  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateDebitoreDto) {
    // Se l'utente non è admin e ha uno studio, assegna automaticamente il suo studioId
    if (user.ruolo !== 'admin' && user.studioId) {
      dto.studioId = user.studioId;
    }
    return this.debitoriService.create(dto);
  }

  // PUT /debitori/:id -> aggiornamento debitore
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDebitoreDto) {
    return this.debitoriService.update(id, dto);
  }

  // PATCH /debitori/:id/deactivate -> disattiva debitore (soft-delete)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.debitoriService.deactivate(id);
  }

  // PATCH /debitori/:id/reactivate -> riattiva debitore
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.debitoriService.reactivate(id);
  }

  // DELETE /debitori/:id -> eliminazione fisica debitore
  // ATTENZIONE: preferire deactivate nella maggior parte dei casi
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debitoriService.remove(id);
  }
}