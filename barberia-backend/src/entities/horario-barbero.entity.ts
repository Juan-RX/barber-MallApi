import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Barbero } from './barbero.entity';

@Entity('horario_barbero', { schema: 'barberia' })
export class HorarioBarbero {
  @PrimaryGeneratedColumn({ name: 'horario_barbero_id' })
  horarioBarberoId: number;

  @Column({ name: 'barbero_id' })
  barberoId: number;

  @ManyToOne(() => Barbero, (barbero) => barbero.horarios)
  @JoinColumn({ name: 'barbero_id' })
  barbero: Barbero;

  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number; // 1=Lunes, 2=Martes, ..., 7=Domingo

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string; // Formato HH:MM:SS

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string; // Formato HH:MM:SS

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio?: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

