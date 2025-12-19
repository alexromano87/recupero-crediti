// apps/backend/src/users/dto/update-user.dto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import type { UserRole } from '../user.entity';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  cognome?: string;

  @IsEnum(['admin', 'avvocato', 'collaboratore', 'segreteria', 'cliente'])
  @IsOptional()
  ruolo?: UserRole;

  @IsUUID()
  @IsOptional()
  clienteId?: string | null;

  @IsUUID()
  @IsOptional()
  studioId?: string | null;

  @IsBoolean()
  @IsOptional()
  attivo?: boolean;
}
