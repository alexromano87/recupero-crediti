// apps/backend/src/alerts/alerts.controller.ts
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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AddMessaggioDto } from './dto/add-messaggio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() createAlertDto: CreateAlertDto) {
    if (user.ruolo !== 'admin' && user.studioId) {
      createAlertDto.studioId = user.studioId;
    }
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.alertsService.findAll(includeInactive, studioId);
  }

  @Get('pratica/:praticaId')
  findAllByPratica(
    @Param('praticaId') praticaId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    return this.alertsService.findAllByPratica(praticaId, includeInactive);
  }

  @Get('stato/:stato')
  findAllByStato(
    @CurrentUser() user: CurrentUserData,
    @Param('stato') stato: 'in_gestione' | 'chiuso',
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.alertsService.findAllByStato(stato, includeInactive, studioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.alertsService.deactivate(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.alertsService.reactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }

  @Post(':id/messaggi')
  addMessaggio(@Param('id') id: string, @Body() addMessaggioDto: AddMessaggioDto) {
    return this.alertsService.addMessaggio(id, addMessaggioDto);
  }

  @Patch(':id/chiudi')
  chiudiAlert(@Param('id') id: string) {
    return this.alertsService.chiudiAlert(id);
  }

  @Patch(':id/riapri')
  riapriAlert(@Param('id') id: string) {
    return this.alertsService.riapriAlert(id);
  }
}
