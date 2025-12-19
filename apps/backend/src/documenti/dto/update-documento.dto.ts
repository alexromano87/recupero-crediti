// apps/backend/src/documenti/dto/update-documento.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateDocumentoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsUUID()
  cartellaId?: string;
}
