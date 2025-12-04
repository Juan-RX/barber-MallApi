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
import { Cliente } from './cliente.entity';
import { Sucursal } from './sucursal.entity';
import { CatEstadoVenta } from './catestadoventa.entity';
import { VentaLinea } from './venta-linea.entity';
import { Comprobante } from './comprobante.entity';
import { TransaccionPago } from './transaccion-pago.entity';

@Entity('venta', { schema: 'barberia' })
export class Venta {
  @PrimaryGeneratedColumn({ name: 'venta_id' })
  ventaId: number;

  @Column({ name: 'order_code', type: 'varchar', length: 30, unique: true })
  orderCode: string;

  @Column({ name: 'cliente_id', nullable: true })
  clienteId?: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.ventas)
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente;

  @Column({ name: 'sucursal_id' })
  sucursalId: number;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.ventas)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @Column({ name: 'estado_venta_id' })
  estadoVentaId: number;

  @ManyToOne(() => CatEstadoVenta, (estado) => estado.ventas)
  @JoinColumn({ name: 'estado_venta_id' })
  estadoVenta: CatEstadoVenta;

  @Column({ name: 'total_bruto', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalBruto: number;

  @Column({ name: 'descuento_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuentoTotal: number;

  @Column({ name: 'total_neto', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalNeto: number;

  @Column({ type: 'varchar', length: 50, default: 'LOCAL' })
  origen: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comentarios?: string;

  @Column({ name: 'confirmation_code', type: 'varchar', length: 100, nullable: true })
  confirmationCode?: string;

  @Column({ name: 'confirmation_code_created_at', type: 'varchar', length: 200, nullable: true })
  confirmationCodeCreatedAt?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VentaLinea, (ventaLinea) => ventaLinea.venta)
  ventaLineas: VentaLinea[];

  @OneToMany(() => Comprobante, (comprobante) => comprobante.venta)
  comprobantes: Comprobante[];

  @OneToMany(() => TransaccionPago, (transaccion) => transaccion.venta)
  transacciones: TransaccionPago[];
}

