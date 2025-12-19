// apps/backend/src/avvocati/avvocati.controller.ts
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
import { AvvocatiService } from './avvocati.service';
import { CreateAvvocatoDto } from './create-avvocato.dto';
import { UpdateAvvocatoDto } from './update-avvocato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('avvocati')
@UseGuards(JwtAuthGuard)
export class AvvocatiController {
  constructor(private readonly avvocatiService: AvvocatiService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() createAvvocatoDto: CreateAvvocatoDto) {
    // Se l'utente non è admin e ha uno studio, assegna automaticamente il suo studioId
    if (user.ruolo !== 'admin' && user.studioId) {
      createAvvocatoDto.studioId = user.studioId;
    }
    return this.avvocatiService.create(createAvvocatoDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.avvocatiService.findAll(includeInactive, studioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.avvocatiService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAvvocatoDto: UpdateAvvocatoDto) {
    return this.avvocatiService.update(id, updateAvvocatoDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.avvocatiService.deactivate(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.avvocatiService.reactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avvocatiService.remove(id);
  }
}
