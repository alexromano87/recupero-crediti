// apps/backend/src/avvocati/create-avvocato.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';
import type {
  LivelloAccessoPratiche,
  LivelloPermessi,
} from './avvocato.entity';

export class CreateAvvocatoDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsString()
  @MaxLength(100)
  nome: string;

  @IsString()
  @MaxLength(100)
  cognome: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  codiceFiscale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsEnum(['solo_proprie', 'tutte'])
  livelloAccessoPratiche?: LivelloAccessoPratiche;

  @IsOptional()
  @IsEnum(['visualizzazione', 'modifica'])
  livelloPermessi?: LivelloPermessi;

  @IsOptional()
  @IsString()
  note?: string;
}
