// src/pratiche/dto/create-pratica.dto.ts
import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { EsitoPratica } from '../pratica.entity';

export class CreatePraticaDto {
  // --- Relazioni obbligatorie ---

  @IsUUID()
  clienteId: string;

  @IsUUID()
  debitoreId: string;

  // --- Fase (opzionale, se non specificato usa la prima fase disponibile) ---

  @IsOptional()
  @IsUUID()
  faseId?: string;

  @IsOptional()
  @IsBoolean()
  aperta?: boolean;

  @IsOptional()
  @IsIn(['positivo', 'negativo', null])
  esito?: EsitoPratica;

  // --- Importi finanziari ---

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capitale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  importoRecuperatoCapitale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  anticipazioni?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  importoRecuperatoAnticipazioni?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compensiLegali?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compensiLiquidati?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interessi?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interessiRecuperati?: number;

  // --- Note e riferimenti ---

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  riferimentoCredito?: string;

  // --- Date ---

  @IsOptional()
  @IsDateString()
  dataAffidamento?: string;

  @IsOptional()
  @IsDateString()
  dataChiusura?: string;

  @IsOptional()
  @IsDateString()
  dataScadenza?: string;
}