// apps/backend/src/clienti/clienti.controller.ts

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
} from '@nestjs/common';
import { ClientiService } from './clienti.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ClientiDebitoriService } from '../relazioni/clienti-debitori.service';

@Controller('clienti')
export class ClientiController {
  constructor(
    private readonly clientiService: ClientiService,
    private readonly clientiDebitoriService: ClientiDebitoriService,
  ) {}

  // ====== CRUD BASE CLIENTI ======

  // GET /clienti  -> lista clienti
  // Query param: ?includeInactive=true per includere i disattivati
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.clientiService.findAll(includeInactive === 'true');
  }

  // GET /clienti/:id  -> dettaglio singolo cliente
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientiService.findOne(id);
  }

  // GET /clienti/:id/pratiche-count -> conta pratiche collegate
  @Get(':id/pratiche-count')
  async getPraticheCount(@Param('id') id: string) {
    const count = await this.clientiService.countPraticheCollegate(id);
    return { count };
  }

  // POST /clienti  -> creazione nuovo cliente
  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientiService.create(dto);
  }

  // PUT /clienti/:id  -> aggiornamento cliente esistente
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientiService.update(id, dto);
  }

  // PATCH /clienti/:id/deactivate -> disattiva cliente (soft-delete)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.clientiService.deactivate(id);
  }

  // PATCH /clienti/:id/reactivate -> riattiva cliente
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.clientiService.reactivate(id);
  }

  // DELETE /clienti/:id  -> eliminazione fisica cliente
  // ATTENZIONE: preferire deactivate nella maggior parte dei casi
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientiService.remove(id);
  }

  // ====== RELAZIONE CLIENTE <-> DEBITORI ======
  // usata dalla pagina Debitori e/o sezione debitori in Clienti

  // GET /clienti/:id/debitori
  @Get(':id/debitori')
  getDebitoriForCliente(@Param('id') id: string) {
    return this.clientiDebitoriService.getDebitoriByCliente(id);
  }

  // PUT /clienti/:id/debitori
  // body: { debitoriIds: string[] }
  @Put(':id/debitori')
  async updateDebitoriForCliente(
    @Param('id') id: string,
    @Body() body: { debitoriIds: string[] },
  ) {
    await this.clientiDebitoriService.setDebitoriForCliente(
      id,
      body.debitoriIds ?? [],
    );
    return { success: true };
  }

  // DELETE /clienti/:id/debitori/:debitoreId
  @Delete(':id/debitori/:debitoreId')
  async unlinkDebitore(
    @Param('id') id: string,
    @Param('debitoreId') debitoreId: string,
  ) {
    await this.clientiDebitoriService.unlinkDebitoreFromCliente(
      id,
      debitoreId,
    );
    return { success: true };
  }
}