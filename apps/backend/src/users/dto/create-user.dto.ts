// apps/backend/src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import type { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nome: string;

  @IsString()
  cognome: string;

  @IsEnum(['admin', 'avvocato', 'collaboratore', 'segreteria', 'cliente'])
  ruolo: UserRole;

  @IsOptional()
  @IsUUID()
  clienteId?: string | null;

  @IsOptional()
  @IsUUID()
  studioId?: string | null;
}
