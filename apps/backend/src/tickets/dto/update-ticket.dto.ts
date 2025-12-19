// apps/backend/src/tickets/dto/update-ticket.dto.ts
import { IsString, IsEnum, IsOptional } from 'class-validator';
import type { TicketStato, TicketPriorita } from '../ticket.entity';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  oggetto?: string;

  @IsString()
  @IsOptional()
  descrizione?: string;

  @IsEnum(['bassa', 'normale', 'alta', 'urgente'])
  @IsOptional()
  priorita?: TicketPriorita;

  @IsEnum(['aperto', 'in_gestione', 'chiuso'])
  @IsOptional()
  stato?: TicketStato;
}
