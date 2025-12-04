import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cita } from './cita.entity';

@Entity('recordatoriolog', { schema: 'barberia' })
export class RecordatorioLog {
  @PrimaryGeneratedColumn({ name: 'recordatorio_id' })
  recordatorioId: number;

  @Column({ name: 'cita_id' })
  citaId: number;

  @ManyToOne(() => Cita, (cita) => cita.recordatorioLogs)
  @JoinColumn({ name: 'cita_id' })
  cita: Cita;

  @Column({ name: 'enviado_at', type: 'timestamptz' })
  enviadoAt: Date;

  @Column({ type: 'varchar', length: 20 })
  canal: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  payload?: string;
}

