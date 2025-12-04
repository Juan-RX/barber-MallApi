import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Sucursal } from './sucursal.entity';
import { Producto } from './producto.entity';

@Entity('inventario', { schema: 'barberia' })
@Unique(['sucursalId', 'productoId'])
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'inventario_id' })
  inventarioId: number;

  @Column({ name: 'sucursal_id' })
  sucursalId: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.inventarios)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @Column({ name: 'producto_id' })
  productoId: number;

  @ManyToOne(() => Producto, (producto) => producto.inventarios)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ name: 'stock_disponible', type: 'int', default: 0 })
  stockDisponible: number;

  @Column({ name: 'stock_reservado', type: 'int', default: 0 })
  stockReservado: number;

  @Column({ name: 'last_sync_mall_at', type: 'timestamptz', nullable: true })
  lastSyncMallAt?: Date;
}

