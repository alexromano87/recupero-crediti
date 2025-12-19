// apps/backend/src/movimenti-finanziari/create-movimento-finanziario.dto.ts
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';
import type { TipoMovimento } from './movimento-finanziario.entity';

export class CreateMovimentoFinanziarioDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsUUID()
  praticaId: string;

  @IsEnum([
    'capitale',
    'anticipazione',
    'compenso',
    'interessi',
    'recupero_capitale',
    'recupero_anticipazione',
    'recupero_compenso',
    'recupero_interessi',
  ])
  tipo: TipoMovimento;

  @IsNumber()
  @Min(0)
  importo: number;

  @IsDateString()
  data: string;

  @IsOptional()
  @IsString()
  oggetto?: string;
}
