import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Barbero } from './barbero.entity';
import { Servicio } from './servicio.entity';
import { Producto } from './producto.entity';
import { Inventario } from './inventario.entity';
import { Cita } from './cita.entity';
import { Venta } from './venta.entity';
import { HorarioSucursal } from './horario-sucursal.entity';

@Entity('sucursal', { schema: 'barberia' })
export class Sucursal {
  @PrimaryGeneratedColumn({ name: 'sucursal_id' })
  sucursalId: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion?: string;

  @Column({ name: 'mall_store_code', type: 'varchar', length: 50, unique: true, nullable: true })
  mallStoreCode?: string;

  @Column({ name: 'codigo_negocio', type: 'varchar', length: 5, unique: true })
  codigoNegocio: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Barbero, (barbero) => barbero.sucursal)
  barberos: Barbero[];

  @OneToMany(() => Servicio, (servicio) => servicio.sucursal)
  servicios: Servicio[];

  @OneToMany(() => Producto, (producto) => producto.sucursal)
  productos: Producto[];

  @OneToMany(() => Inventario, (inventario) => inventario.sucursal)
  inventarios: Inventario[];

  @OneToMany(() => Cita, (cita) => cita.sucursal)
  citas: Cita[];

  @OneToMany(() => Venta, (venta) => venta.sucursal)
  ventas: Venta[];

  @OneToMany(() => HorarioSucursal, (horario) => horario.sucursal)
  horarios: HorarioSucursal[];
}

