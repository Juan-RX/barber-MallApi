import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Sucursal } from './sucursal.entity';
import { Cita } from './cita.entity';
import { HorarioBarbero } from './horario-barbero.entity';
import { PausaBarbero } from './pausa-barbero.entity';

@Entity('barbero', { schema: 'barberia' })
export class Barbero {
  @PrimaryGeneratedColumn({ name: 'barbero_id' })
  barberoId: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'sucursal_id', nullable: true })
  sucursalId?: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.barberos)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Sucursal;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Cita, (cita) => cita.barbero)
  citas: Cita[];

  @OneToMany(() => HorarioBarbero, (horario) => horario.barbero)
  horarios: HorarioBarbero[];

  @OneToMany(() => PausaBarbero, (pausa) => pausa.barbero)
  pausas: PausaBarbero[];
}

