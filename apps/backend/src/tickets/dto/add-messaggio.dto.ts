// apps/backend/src/tickets/dto/add-messaggio.dto.ts
import { IsString, IsEnum } from 'class-validator';

export class AddMessaggioDto {
  @IsEnum(['studio', 'cliente'])
  autore: 'studio' | 'cliente';

  @IsString()
  testo: string;
}
