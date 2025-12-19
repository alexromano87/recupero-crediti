// apps/backend/src/alerts/dto/update-alert.dto.ts
import { IsString, IsEnum, IsDateString, IsInt, Min, IsOptional } from 'class-validator';
import type { AlertStato, AlertDestinatario } from '../alert.entity';

export class UpdateAlertDto {
  @IsString()
  @IsOptional()
  titolo?: string;

  @IsString()
  @IsOptional()
  descrizione?: string;

  @IsEnum(['studio', 'cliente'])
  @IsOptional()
  destinatario?: AlertDestinatario;

  @IsDateString()
  @IsOptional()
  dataScadenza?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  giorniAnticipo?: number;

  @IsEnum(['in_gestione', 'chiuso'])
  @IsOptional()
  stato?: AlertStato;
}
