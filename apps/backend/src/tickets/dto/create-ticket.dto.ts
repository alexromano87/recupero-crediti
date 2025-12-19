// apps/backend/src/tickets/dto/create-ticket.dto.ts
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import type { TicketPriorita, TicketCategoria } from '../ticket.entity';

export class CreateTicketDto {
  @IsOptional()
  @IsUUID()
  studioId?: string | null;

  @IsUUID()
  @IsOptional()
  praticaId?: string | null;

  @IsString()
  oggetto: string;

  @IsString()
  descrizione: string;

  @IsString()
  autore: string;

  @IsEnum(['richiesta_informazioni', 'documentazione', 'pagamenti', 'segnalazione_problema', 'altro'])
  @IsOptional()
  categoria?: TicketCategoria;

  @IsEnum(['bassa', 'normale', 'alta', 'urgente'])
  @IsOptional()
  priorita?: TicketPriorita;
}
