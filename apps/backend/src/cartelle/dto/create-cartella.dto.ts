// apps/backend/src/cartelle/dto/create-cartella.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCartellaDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsString()
  colore?: string;

  @IsOptional()
  @IsUUID()
  praticaId?: string;

  @IsOptional()
  @IsUUID()
  cartellaParentId?: string;
}
