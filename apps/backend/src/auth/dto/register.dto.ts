// apps/backend/src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import type { UserRole } from '../../users/user.entity';

export class RegisterDto {
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
  @IsOptional()
  ruolo?: UserRole;

  @IsUUID()
  @IsOptional()
  clienteId?: string | null;
}
