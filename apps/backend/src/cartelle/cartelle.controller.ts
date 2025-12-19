// apps/backend/src/cartelle/cartelle.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CartelleService } from './cartelle.service';
import { CreateCartellaDto } from './dto/create-cartella.dto';
import { UpdateCartellaDto } from './dto/update-cartella.dto';
import { Cartella } from './cartella.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('cartelle')
@UseGuards(JwtAuthGuard)
export class CartelleController {
  constructor(private readonly cartelleService: CartelleService) {}

  @Post()
  async create(@CurrentUser() user: CurrentUserData, @Body() createDto: CreateCartellaDto): Promise<Cartella> {
    if (user.ruolo !== 'admin' && user.studioId) {
      createDto.studioId = user.studioId;
    }
    return this.cartelleService.create(createDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Cartella[]> {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.cartelleService.findAll(includeInactive === 'true', studioId);
  }

  @Get('pratica/:praticaId')
  async findByPratica(
    @Param('praticaId') praticaId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Cartella[]> {
    return this.cartelleService.findByPratica(
      praticaId,
      includeInactive === 'true',
    );
  }

  @Get('tree')
  async findTree(@Query('praticaId') praticaId?: string): Promise<Cartella[]> {
    return this.cartelleService.findTree(praticaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Cartella> {
    return this.cartelleService.findOne(id);
  }

  @Get(':id/descendants')
  async findDescendants(@Param('id') id: string): Promise<Cartella[]> {
    return this.cartelleService.findDescendants(id);
  }

  @Get(':id/ancestors')
  async findAncestors(@Param('id') id: string): Promise<Cartella[]> {
    return this.cartelleService.findAncestors(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCartellaDto,
  ): Promise<Cartella> {
    return this.cartelleService.update(id, updateDto);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<Cartella> {
    return this.cartelleService.deactivate(id);
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string): Promise<Cartella> {
    return this.cartelleService.reactivate(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.cartelleService.remove(id);
  }
}
