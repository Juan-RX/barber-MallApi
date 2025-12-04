import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sucursal } from './sucursal.entity';
import { Barbero } from './barbero.entity';

export enum TipoExcepcion {
  SUCURSAL_CERRADA = 'SUCURSAL_CERRADA',
  BARBERO_AUSENTE = 'BARBERO_AUSENTE',
  HORARIO_ESPECIAL_SUCURSAL = 'HORARIO_ESPECIAL_SUCURSAL',
  HORARIO_ESPECIAL_BARBERO = 'HORARIO_ESPECIAL_BARBERO',
}

@Entity('excepcion_horario', { schema: 'barberia' })
export class ExcepcionHorario {
  @PrimaryGeneratedColumn({ name: 'excepcion_id' })
  excepcionId: number;

  @Column({
    type: 'enum',
    enum: TipoExcepcion,
  })
  tipo: TipoExcepcion;

  @Column({ name: 'sucursal_id', nullable: true })
  sucursalId?: number;

  @ManyToOne(() => Sucursal, { nullable: true })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Sucursal;

  @Column({ name: 'barbero_id', nullable: true })
  barberoId?: number;

  @ManyToOne(() => Barbero, { nullable: true })
  @JoinColumn({ name: 'barbero_id' })
  barbero?: Barbero;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  horaInicio?: string; // Para horarios especiales

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin?: string; // Para horarios especiales

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

