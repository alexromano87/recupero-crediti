// src/fasi/dto/create-fase.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFaseDto {
  @IsString()
  @MaxLength(100)
  nome: string;

  @IsString()
  @MaxLength(50)
  codice: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordine?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  colore?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icona?: string;

  @IsOptional()
  @IsBoolean()
  isFaseChiusura?: boolean;
}