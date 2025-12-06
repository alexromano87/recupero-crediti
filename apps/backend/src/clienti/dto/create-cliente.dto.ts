import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

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
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
