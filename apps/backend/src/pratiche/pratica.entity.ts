// src/pratiche/pratica.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from '../clienti/cliente.entity';
import { Debitore } from '../debitori/debitore.entity';

// Esito della pratica (solo se chiusa)
export type EsitoPratica = 'positivo' | 'negativo' | null;

// Entry nello storico delle fasi
export interface StoricoFase {
  faseId: string;
  faseCodice: string;
  faseNome: string;
  dataInizio: string; // ISO date
  dataFine?: string; // ISO date, null se fase corrente
  note?: string;
}

@Entity('pratiche')
export class Pratica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Stato attivo/disattivato (soft-delete) ---
  @Column({ default: true })
  attivo: boolean;

  // --- Relazioni con Cliente e Debitore ---

  @Column({ type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => Cliente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid' })
  debitoreId: string;

  @ManyToOne(() => Debitore, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'debitoreId' })
  debitore: Debitore;

  // --- Fase corrente (ID hardcoded, es. 'fase-001') ---
  @Column({ type: 'varchar', length: 20, default: 'fase-001' })
  faseId: string;

  // --- Stato della pratica ---

  @Column({ default: true })
  aperta: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  esito: EsitoPratica;

  // --- Importi finanziari ---
  // Tutti i campi decimal per precisione monetaria

  // Capitale da recuperare (importo originale del credito)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  capitale: number;

  // Capitale già recuperato
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  importoRecuperatoCapitale: number;

  // Anticipazioni (spese anticipate dallo studio)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  anticipazioni: number;

  // Anticipazioni già recuperate
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  importoRecuperatoAnticipazioni: number;

  // Compensi legali maturati
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  compensiLegali: number;

  // Compensi già liquidati/incassati
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  compensiLiquidati: number;

  // --- Interessi e more (opzionali, per calcoli futuri) ---

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interessi: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  interessiRecuperati: number;

  // --- Note e descrizione ---

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ nullable: true })
  riferimentoCredito?: string; // es. numero fattura, contratto, etc.

  // --- Storico fasi (JSON) ---
  // Contiene l'array di StoricoFase per tracciare i passaggi
  @Column({ type: 'json', nullable: true })
  storico?: StoricoFase[];

  // --- Date importanti ---

  @Column({ type: 'date', nullable: true })
  dataAffidamento?: Date; // quando il cliente ha affidato la pratica

  @Column({ type: 'date', nullable: true })
  dataChiusura?: Date; // quando la pratica è stata chiusa

  @Column({ type: 'date', nullable: true })
  dataScadenza?: Date; // scadenza/termine importante

  // --- Meta ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}