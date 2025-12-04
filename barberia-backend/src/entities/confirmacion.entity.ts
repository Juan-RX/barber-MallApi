import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('confirmacion', { schema: 'barberia' })
export class Confirmacion {
  @PrimaryGeneratedColumn({ name: 'confirmacion_id' })
  confirmacionId: number;

  @Column({ name: 'cita_id' })
  citaId: number;

  @ManyToOne(() => Cita, (cita) => cita.confirmaciones)
  @JoinColumn({ name: 'cita_id' })
  cita: Cita;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'varchar', length: 20 })
  estado: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

