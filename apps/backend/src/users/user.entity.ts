// apps/backend/src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Studio } from '../studi/studio.entity';

export type UserRole = 'admin' | 'avvocato' | 'collaboratore' | 'segreteria' | 'cliente';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hash bcrypt

  @Column()
  nome: string;

  @Column()
  cognome: string;

  @Column({ type: 'enum', enum: ['admin', 'avvocato', 'collaboratore', 'segreteria', 'cliente'], default: 'collaboratore' })
  ruolo: UserRole;

  @Column({ type: 'uuid', nullable: true })
  clienteId: string | null; // Per utenti di tipo 'cliente'

  @Column({ type: 'uuid', nullable: true })
  studioId: string | null; // Studio di appartenenza (null per admin e clienti)

  @Column({ default: true })
  attivo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  // Relazioni
  @ManyToOne(() => Studio, (studio) => studio.users, { nullable: true })
  @JoinColumn({ name: 'studioId' })
  studio: Studio | null;
}
