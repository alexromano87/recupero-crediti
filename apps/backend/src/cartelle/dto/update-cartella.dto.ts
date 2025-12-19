// apps/backend/src/cartelle/dto/update-cartella.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateCartellaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsString()
  colore?: string;

  @IsOptional()
  @IsUUID()
  cartellaParentId?: string;
}
