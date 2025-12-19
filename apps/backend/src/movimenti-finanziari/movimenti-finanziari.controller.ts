// apps/backend/src/movimenti-finanziari/movimenti-finanziari.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MovimentiFinanziariService } from './movimenti-finanziari.service';
import { CreateMovimentoFinanziarioDto } from './create-movimento-finanziario.dto';
import { UpdateMovimentoFinanziarioDto } from './update-movimento-finanziario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('movimenti-finanziari')
@UseGuards(JwtAuthGuard)
export class MovimentiFinanziariController {
  constructor(private readonly movimentiService: MovimentiFinanziariService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() createMovimentoDto: CreateMovimentoFinanziarioDto) {
    // Se l'utente non è admin e ha uno studio, assegna automaticamente il suo studioId
    if (user.ruolo !== 'admin' && user.studioId) {
      createMovimentoDto.studioId = user.studioId;
    }
    return this.movimentiService.create(createMovimentoDto);
  }

  @Get('pratica/:praticaId')
  findAllByPratica(@CurrentUser() user: CurrentUserData, @Param('praticaId') praticaId: string) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.movimentiService.findAllByPratica(praticaId, studioId);
  }

  @Get('pratica/:praticaId/totali')
  getTotaliByPratica(@CurrentUser() user: CurrentUserData, @Param('praticaId') praticaId: string) {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.movimentiService.getTotaliByPratica(praticaId, studioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movimentiService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMovimentoDto: UpdateMovimentoFinanziarioDto,
  ) {
    return this.movimentiService.update(id, updateMovimentoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movimentiService.remove(id);
  }
}
