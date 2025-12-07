// src/debitori/dto/create-debitore.dto.ts
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import type { TipoSoggetto, TipologiaAzienda } from '../debitore.entity';

export class CreateDebitoreDto {
  @IsIn(['persona_fisica', 'persona_giuridica'])
  tipoSoggetto: TipoSoggetto;

  // --- PF ---

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  cognome?: string;

  @IsOptional()
  @IsString()
  @Length(11, 16)
  codiceFiscale?: string;

  @IsOptional()
  @IsDateString()
  dataNascita?: string;

  @IsOptional()
  @IsString()
  luogoNascita?: string;

  // --- PG ---

  @IsOptional()
  @IsString()
  ragioneSociale?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  partitaIva?: string;

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
  ] as TipologiaAzienda[])
  tipologia?: TipologiaAzienda;

  @IsOptional()
  @IsString()
  sedeLegale?: string;

  @IsOptional()
  @IsString()
  sedeOperativa?: string;

  // --- Indirizzo / contatti comuni ---

  @IsOptional()
  @IsString()
  indirizzo?: string;

  @IsOptional()
  @IsString()
  cap?: string;

  @IsOptional()
  @IsString()
  citta?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  nazione?: string;

  @IsOptional()
  @IsString()
  referente?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  pec?: string;

  // --- Clienti collegati ---

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientiIds?: string[];
}
