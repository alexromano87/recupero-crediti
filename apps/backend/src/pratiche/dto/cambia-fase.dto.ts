// src/pratiche/dto/cambia-fase.dto.ts
import { IsUUID, IsIn, IsOptional, IsString } from 'class-validator';
import type { EsitoPratica } from '../pratica.entity';

export class CambiaFaseDto {
  @IsUUID()
  nuovaFaseId: string;

  // Se la nuova fase è di chiusura, specificare l'esito
  @IsOptional()
  @IsIn(['positivo', 'negativo'])
  esito?: EsitoPratica;

  @IsOptional()
  @IsString()
  note?: string;
}