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
import { Inventario } from './inventario.entity';
import { VentaLinea } from './venta-linea.entity';

@Entity('producto', { schema: 'barberia' })
export class Producto {
  @PrimaryGeneratedColumn({ name: 'producto_id' })
  productoId: number;

  @Column({ name: 'store_id', nullable: true })
  storeId?: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.productos)
  @JoinColumn({ name: 'store_id' })
  sucursal?: Sucursal;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria?: string;

  @Column({ name: 'precio_base', type: 'decimal', precision: 10, scale: 2 })
  precioBase: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  talla?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  opciones?: string;

  @Column({ name: 'duracion_minutos', type: 'int', nullable: true })
  duracionMinutos?: number;

  @Column({ name: 'sku_interno', type: 'varchar', length: 50, unique: true })
  skuInterno: string;

  @Column({ name: 'product_external_id', type: 'varchar', length: 50, unique: true, nullable: true })
  productExternalId?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Inventario, (inventario) => inventario.producto)
  inventarios: Inventario[];

  @OneToMany(() => VentaLinea, (ventaLinea) => ventaLinea.producto)
  ventaLineas: VentaLinea[];
}

