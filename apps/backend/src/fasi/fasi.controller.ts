// src/fasi/fasi.controller.ts
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
import { FasiService } from './fasi.service';
import { CreateFaseDto } from './dto/create-fase.dto';
import { UpdateFaseDto } from './dto/update-fase.dto';

@Controller('fasi')
export class FasiController {
  constructor(private readonly fasiService: FasiService) {}

  // GET /fasi -> lista fasi ordinate
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.fasiService.findAll(includeInactive === 'true');
  }

  // GET /fasi/:id -> dettaglio fase
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fasiService.findOne(id);
  }

  // POST /fasi -> crea nuova fase
  @Post()
  create(@Body() dto: CreateFaseDto) {
    return this.fasiService.create(dto);
  }

  // POST /fasi/initialize -> inizializza fasi di default
  @Post('initialize')
  initialize() {
    return this.fasiService.initializeDefaults();
  }

  // PUT /fasi/:id -> aggiorna fase
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFaseDto) {
    return this.fasiService.update(id, dto);
  }

  // PUT /fasi/reorder -> riordina fasi
  @Put('reorder')
  reorder(@Body() body: { orderedIds: string[] }) {
    return this.fasiService.reorder(body.orderedIds);
  }

  // PATCH /fasi/:id/deactivate -> disattiva fase
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.fasiService.deactivate(id);
  }

  // PATCH /fasi/:id/reactivate -> riattiva fase
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.fasiService.reactivate(id);
  }

  // DELETE /fasi/:id -> elimina fase
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fasiService.remove(id);
  }
}