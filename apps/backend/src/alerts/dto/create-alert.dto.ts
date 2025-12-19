// apps/backend/src/alerts/dto/create-alert.dto.ts
import { IsString, IsUUID, IsEnum, IsDateString, IsInt, Min, IsOptional } from 'class-validator';
import type { AlertDestinatario } from '../alert.entity';

export class CreateAlertDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsUUID()
  praticaId: string;

  @IsString()
  titolo: string;

  @IsString()
  descrizione: string;

  @IsEnum(['studio', 'cliente'])
  destinatario: AlertDestinatario;

  @IsDateString()
  dataScadenza: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  giorniAnticipo?: number;
}
