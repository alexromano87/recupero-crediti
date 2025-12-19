// apps/backend/src/documenti/documenti.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { DocumentiService } from './documenti.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { Documento, TipoDocumento } from './documento.entity';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

// Utility function to determine document type from file extension
function getTipoDocumento(extension: string): TipoDocumento {
  const ext = extension.toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'immagine';
  if (ext === '.csv') return 'csv';
  if (ext === '.xml') return 'xml';
  return 'altro';
}

// Multer configuration for file upload
const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'documenti');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `documento-${uniqueSuffix}${ext}`);
  },
});

@Controller('documenti')
@UseGuards(JwtAuthGuard)
export class DocumentiController {
  constructor(private readonly documentiService: DocumentiService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(
    @CurrentUser() user: CurrentUserData,
    @UploadedFile() file: Express.Multer.File,
    @Body('nome') nome?: string,
    @Body('descrizione') descrizione?: string,
    @Body('caricatoDa') caricatoDa?: string,
    @Body('praticaId') praticaId?: string,
    @Body('cartellaId') cartellaId?: string,
  ): Promise<Documento> {
    const ext = path.extname(file.originalname);
    const tipo = getTipoDocumento(ext);

    const createDto: CreateDocumentoDto = {
      nome: nome || file.originalname,
      descrizione,
      percorsoFile: file.path,
      nomeOriginale: file.originalname,
      estensione: ext,
      tipo,
      dimensione: file.size,
      caricatoDa,
      praticaId,
      cartellaId,
    };

    // Auto-assegna studioId se l'utente non è admin
    if (user.ruolo !== 'admin' && user.studioId) {
      createDto.studioId = user.studioId;
    }

    return this.documentiService.create(createDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Documento[]> {
    const studioId = user.ruolo === 'admin' ? undefined : user.studioId || undefined;
    return this.documentiService.findAll(includeInactive === 'true', studioId);
  }

  @Get('pratica/:praticaId')
  async findByPratica(
    @Param('praticaId') praticaId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Documento[]> {
    return this.documentiService.findByPratica(
      praticaId,
      includeInactive === 'true',
    );
  }

  @Get('cartella/:cartellaId')
  async findByCartella(
    @Param('cartellaId') cartellaId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Documento[]> {
    return this.documentiService.findByCartella(
      cartellaId,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Documento> {
    return this.documentiService.findOne(id);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, documento } = await this.documentiService.getFileStream(id);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${documento.nomeOriginale}"`,
    });

    return new StreamableFile(stream);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentoDto,
  ): Promise<Documento> {
    return this.documentiService.update(id, updateDto);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<Documento> {
    return this.documentiService.deactivate(id);
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string): Promise<Documento> {
    return this.documentiService.reactivate(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.documentiService.remove(id);
  }
}
