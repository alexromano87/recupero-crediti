// apps/backend/src/tickets/tickets.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddMessaggioDto } from './dto/add-messaggio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() createTicketDto: CreateTicketDto) {
    if (user.ruolo !== 'admin' && user.studioId) {
      createTicketDto.studioId = user.studioId;
    }
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.ticketsService.findAll(includeInactive, studioId);
  }

  @Get('pratica/:praticaId')
  findAllByPratica(
    @Param('praticaId') praticaId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    return this.ticketsService.findAllByPratica(praticaId, includeInactive);
  }

  @Get('stato/:stato')
  findAllByStato(
    @Param('stato') stato: 'aperto' | 'in_gestione' | 'chiuso',
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    return this.ticketsService.findAllByStato(stato, includeInactive);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.ticketsService.deactivate(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.ticketsService.reactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Post(':id/messaggi')
  addMessaggio(@Param('id') id: string, @Body() addMessaggioDto: AddMessaggioDto) {
    return this.ticketsService.addMessaggio(id, addMessaggioDto);
  }

  @Patch(':id/chiudi')
  chiudiTicket(@Param('id') id: string) {
    return this.ticketsService.chiudiTicket(id);
  }

  @Patch(':id/prendi-in-carico')
  prendiInCarico(@Param('id') id: string) {
    return this.ticketsService.prendiInCarico(id);
  }

  @Patch(':id/riapri')
  riapriTicket(@Param('id') id: string) {
    return this.ticketsService.riapriTicket(id);
  }
}
