import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Venta } from './venta.entity';
import { Servicio } from './servicio.entity';
import { Producto } from './producto.entity';
import { Cita } from './cita.entity';

@Entity('ventalinea', { schema: 'barberia' })
@Check(`"tipo_item" IN ('SERVICIO','PRODUCTO')`)
@Check(
  `("tipo_item" = 'SERVICIO' AND "servicio_id" IS NOT NULL) OR ("tipo_item" = 'PRODUCTO' AND "producto_id" IS NOT NULL)`,
)
export class VentaLinea {
  @PrimaryGeneratedColumn({ name: 'venta_linea_id' })
  ventaLineaId: number;

  @Column({ name: 'venta_id' })
  ventaId: number;

  @ManyToOne(() => Venta, (venta) => venta.ventaLineas)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ name: 'tipo_item', type: 'varchar', length: 20 })
  tipoItem: 'SERVICIO' | 'PRODUCTO';

  @Column({ name: 'servicio_id', nullable: true })
  servicioId?: number;

  @ManyToOne(() => Servicio, (servicio) => servicio.ventaLineas)
  @JoinColumn({ name: 'servicio_id' })
  servicio?: Servicio;

  @Column({ name: 'producto_id', nullable: true })
  productoId?: number;

  @ManyToOne(() => Producto, (producto) => producto.ventaLineas)
  @JoinColumn({ name: 'producto_id' })
  producto?: Producto;

  @Column({ name: 'cita_id', nullable: true })
  citaId?: number;

  @ManyToOne(() => Cita, (cita) => cita.ventaLineas)
  @JoinColumn({ name: 'cita_id' })
  cita?: Cita;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ name: 'price_unit', type: 'decimal', precision: 12, scale: 2 })
  priceUnit: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'price_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  priceTotal: number;

  @Column({ name: 'service_external_id', type: 'varchar', length: 50, nullable: true })
  serviceExternalId?: string;

  @Column({ name: 'product_external_id', type: 'varchar', length: 50, nullable: true })
  productExternalId?: string;

  @Column({ name: 'appointment_time', type: 'timestamptz', nullable: true })
  appointmentTime?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  size?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  options?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

