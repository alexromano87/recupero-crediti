import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clienti')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  ragioneSociale: string;

  @Column({ nullable: true, length: 16 })
  codiceFiscale?: string;

  @Column({ nullable: true, length: 11 })
  partitaIva?: string;

  @Column({ nullable: true })
  indirizzo?: string;

  @Column({ nullable: true, length: 10 })
  cap?: string;

  @Column({ nullable: true })
  citta?: string;

  @Column({ nullable: true, length: 2 })
  provincia?: string;

  @Column({ nullable: true, length: 2 })
  nazione?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  email?: string;
}
