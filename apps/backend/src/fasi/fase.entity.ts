// src/fasi/fase.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fasi')
export class Fase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nome della fase (es. "Analisi preliminare", "Messa in mora", etc.)
  @Column({ length: 100 })
  nome: string;

  // Codice univoco per riferimenti interni (es. "analisi_preliminare")
  @Column({ length: 50, unique: true })
  codice: string;

  // Descrizione opzionale della fase
  @Column({ type: 'text', nullable: true })
  descrizione?: string;

  // Ordine di visualizzazione (1, 2, 3, ...)
  @Column({ type: 'int', default: 0 })
  ordine: number;

  // Colore per UI (hex, es. "#3B82F6")
  @Column({ length: 20, nullable: true })
  colore?: string;

  // Icona (nome icona Lucide, es. "FileSearch", "Mail", "Gavel")
  @Column({ length: 50, nullable: true })
  icona?: string;

  // Se questa fase indica che la pratica è chiusa
  @Column({ default: false })
  isFaseChiusura: boolean;

  // Se la fase è attiva (soft delete)
  @Column({ default: true })
  attivo: boolean;

  // Meta
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}