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
import { VentaLinea } from './venta-linea.entity';

@Entity('servicio', { schema: 'barberia' })
export class Servicio {
  @PrimaryGeneratedColumn({ name: 'servicio_id' })
  servicioId: number;

  @Column({ name: 'store_id', nullable: true })
  storeId?: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.servicios)
  @JoinColumn({ name: 'store_id' })
  sucursal?: Sucursal;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  talla?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color?: string;

  @Column({ type: 'int', nullable: true })
  stock?: number;

  @Column({ name: 'duracion_minutos', type: 'int' })
  duracionMinutos: number;

  @Column({ name: 'codigo_externo', type: 'varchar', length: 50, unique: true, nullable: true })
  codigoExterno?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Cita, (cita) => cita.servicio)
  citas: Cita[];

  @OneToMany(() => VentaLinea, (ventaLinea) => ventaLinea.servicio)
  ventaLineas: VentaLinea[];
}

