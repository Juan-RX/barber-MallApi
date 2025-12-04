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

@Entity('pausa_barbero', { schema: 'barberia' })
export class PausaBarbero {
  @PrimaryGeneratedColumn({ name: 'pausa_id' })
  pausaId: number;

  @Column({ name: 'barbero_id' })
  barberoId: number;

  @ManyToOne(() => Barbero, (barbero) => barbero.pausas)
  @JoinColumn({ name: 'barbero_id' })
  barbero: Barbero;

  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number; // 1=Lunes, 2=Martes, ..., 7=Domingo

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string; // Formato HH:MM:SS

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string; // Formato HH:MM:SS

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo?: string; // Ej: "Comida", "Descanso"

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

