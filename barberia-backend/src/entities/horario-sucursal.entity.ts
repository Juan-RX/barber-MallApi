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

@Entity('horario_sucursal', { schema: 'barberia' })
export class HorarioSucursal {
  @PrimaryGeneratedColumn({ name: 'horario_sucursal_id' })
  horarioSucursalId: number;

  @Column({ name: 'sucursal_id' })
  sucursalId: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.horarios)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number; // 1=Lunes, 2=Martes, ..., 7=Domingo

  @Column({ name: 'hora_apertura', type: 'time' })
  horaApertura: string; // Formato HH:MM:SS

  @Column({ name: 'hora_cierre', type: 'time' })
  horaCierre: string; // Formato HH:MM:SS

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'es_cerrado', type: 'boolean', default: false })
  esCerrado: boolean;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio?: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

