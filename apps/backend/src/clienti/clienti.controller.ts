// apps/backend/src/clienti/clienti.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

  // GET /clienti  -> usato dalla lista clienti nel frontend
  @Get()
  findAll() {
    return this.clientiService.findAll();
  }

  // GET /clienti/:id  -> se ti serve il dettaglio di un singolo cliente
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientiService.findOne(id);
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

  // DELETE /clienti/:id  -> eliminazione cliente
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
