import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';
import type { TipologiaAzienda } from '../cliente.entity';

export class CreateClienteDto {
  @IsString()
  ragioneSociale: string;

  @IsOptional()
  @IsString()
  @Length(11, 16)
  codiceFiscale?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  partitaIva?: string;

  // --- Sedi ---

  @IsOptional()
  @IsString()
  sedeLegale?: string;

  @IsOptional()
  @IsString()
  sedeOperativa?: string;

  @IsOptional()
  @IsString()
  indirizzo?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5)
  cap?: string;

  @IsOptional()
  @IsString()
  citta?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2)
  provincia?: string;

  @IsOptional()
  @IsString()
  nazione?: string;

  // --- Tipologia / referente ---

  @IsOptional()
  @IsIn([
    'impresa_individuale',
    'impresa_individuale_agricola',
    'srl',
    'spa',
    'scpa',
    'srl_agricola',
    'snc',
    'sas',
  ])
  tipologia?: TipologiaAzienda;

  @IsOptional()
  @IsString()
  referente?: string;

  // --- Contatti ---

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  pec?: string;
}
