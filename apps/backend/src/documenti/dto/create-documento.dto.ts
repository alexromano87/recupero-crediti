// apps/backend/src/documenti/dto/create-documento.dto.ts
import { IsString, IsOptional, IsUUID, IsEnum, IsNumber } from 'class-validator';
import type { TipoDocumento } from '../documento.entity';

export class CreateDocumentoDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsString()
  percorsoFile: string;

  @IsString()
  nomeOriginale: string;

  @IsString()
  estensione: string;

  @IsEnum(['pdf', 'word', 'excel', 'immagine', 'csv', 'xml', 'altro'])
  tipo: TipoDocumento;

  @IsNumber()
  dimensione: number;

  @IsOptional()
  @IsString()
  caricatoDa?: string;

  @IsOptional()
  @IsUUID()
  praticaId?: string;

  @IsOptional()
  @IsUUID()
  cartellaId?: string;
}
