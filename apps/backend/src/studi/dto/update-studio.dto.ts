import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class UpdateStudioDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  ragioneSociale?: string;

  @IsString()
  @IsOptional()
  partitaIva?: string;

  @IsString()
  @IsOptional()
  codiceFiscale?: string;

  @IsString()
  @IsOptional()
  indirizzo?: string;

  @IsString()
  @IsOptional()
  citta?: string;

  @IsString()
  @IsOptional()
  cap?: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEmail()
  @IsOptional()
  pec?: string;

  @IsBoolean()
  @IsOptional()
  attivo?: boolean;
}
