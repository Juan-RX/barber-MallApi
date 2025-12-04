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
import { Servicio } from './servicio.entity';
import { Cliente } from './cliente.entity';
import { Barbero } from './barbero.entity';
import { Sucursal } from './sucursal.entity';
import { CatEstadoCita } from './catestadocita.entity';
import { Confirmacion } from './confirmacion.entity';
import { RecordatorioLog } from './recordatorio-log.entity';
import { VentaLinea } from './venta-linea.entity';

@Entity('cita', { schema: 'barberia' })
export class Cita {
  @PrimaryGeneratedColumn({ name: 'cita_id' })
  citaId: number;

  @Column({ name: 'servicio_id' })
  servicioId: number;

  @ManyToOne(() => Servicio, (servicio) => servicio.citas)
  @JoinColumn({ name: 'servicio_id' })
  servicio: Servicio;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.citas)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'barbero_id', nullable: true })
  barberoId?: number;

  @ManyToOne(() => Barbero, (barbero) => barbero.citas)
  @JoinColumn({ name: 'barbero_id' })
  barbero?: Barbero;

  @Column({ name: 'sucursal_id', nullable: true })
  sucursalId?: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.citas)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal?: Sucursal;

  @Column({ name: 'fecha_inicio', type: 'timestamptz' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamptz' })
  fechaFin: Date;

  @Column({ name: 'estado_cita_id' })
  estadoCitaId: number;

  @ManyToOne(() => CatEstadoCita, (estado) => estado.citas)
  @JoinColumn({ name: 'estado_cita_id' })
  estadoCita: CatEstadoCita;

  @Column({ type: 'varchar', length: 50, default: 'LOCAL' })
  origen: string;

  @Column({ name: 'slot_id_mall', type: 'varchar', length: 50, nullable: true })
  slotIdMall?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notas?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Confirmacion, (confirmacion) => confirmacion.cita)
  confirmaciones: Confirmacion[];

  @OneToMany(() => RecordatorioLog, (log) => log.cita)
  recordatorioLogs: RecordatorioLog[];

  @OneToMany(() => VentaLinea, (ventaLinea) => ventaLinea.cita)
  ventaLineas: VentaLinea[];
}

