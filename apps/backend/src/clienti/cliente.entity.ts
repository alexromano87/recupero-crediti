import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OneToMany } from 'typeorm';
import { ClienteDebitore } from '../relazioni/cliente-debitore.entity';

export type TipologiaAzienda =
  | 'impresa_individuale'
  | 'impresa_individuale_agricola'
  | 'srl'
  | 'spa'
  | 'scpa'
  | 'srl_agricola'
  | 'snc'
  | 'sas';

@Entity('clienti')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- Stato attivo/disattivato (soft-delete) ---
  @Column({ default: true })
  attivo: boolean;

  @Column()
  ragioneSociale: string;

  @Column({ nullable: true, length: 16 })
  codiceFiscale?: string;

  @Column({ nullable: true, length: 11 })
  partitaIva?: string;

  // --- Dati aziendali / sedi ---

  @Column({ nullable: true })
  sedeLegale?: string;       // es: via + civico + CAP + città (oppure descrizione libera)

  @Column({ nullable: true })
  sedeOperativa?: string;

  @Column({ nullable: true })
  indirizzo?: string;

  @Column({ nullable: true, length: 5 })
  cap?: string;

  @Column({ nullable: true })
  citta?: string;

  @Column({ nullable: true, length: 2 })
  provincia?: string;

  @Column({ nullable: true, length: 2 })
  nazione?: string;

  // --- Tipologia / referente ---

  @Column({ nullable: true })
  tipologia?: TipologiaAzienda;

  @Column({ nullable: true })
  referente?: string;

  // --- Contatti ---

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  pec?: string;

  @OneToMany(() => ClienteDebitore, (cd) => cd.cliente)
  clientiDebitori: ClienteDebitore[];
}