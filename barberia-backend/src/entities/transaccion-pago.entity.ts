import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venta } from './venta.entity';
import { CatEstadoTransaccion } from './catestadotransaccion.entity';

@Entity('transaccionpago', { schema: 'barberia' })
export class TransaccionPago {
  @PrimaryGeneratedColumn({ name: 'transaccion_id' })
  transaccionId: number;

  @Column({ name: 'venta_id' })
  ventaId: number;

  @ManyToOne(() => Venta, (venta) => venta.transacciones)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ name: 'codigo_negocio', type: 'varchar', length: 5 })
  codigoNegocio: string;

  @Column({ name: 'transaccion_externa_id', type: 'varchar', length: 100, unique: true })
  transaccionExternaId: string;

  @Column({ name: 'tipo', type: 'varchar', length: 50, nullable: true })
  tipo?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ name: 'estado_tx_id' })
  estadoTxId: number;

  @ManyToOne(() => CatEstadoTransaccion, (estado) => estado.transacciones)
  @JoinColumn({ name: 'estado_tx_id' })
  estadoTx: CatEstadoTransaccion;

  @Column({ name: 'numero_tarjeta', type: 'varchar', length: 34, nullable: true })
  numeroTarjeta?: string;

  @Column({ name: 'estado_banco_id', type: 'varchar', length: 50, nullable: true })
  estadoBancoId?: string;

  @Column({ name: 'firma', type: 'varchar', length: 255, nullable: true })
  firma?: string;

  @Column({ name: 'creada_utc', type: 'timestamptz', nullable: true })
  creadaUtc?: Date;

  @Column({ name: 'banco_payload', type: 'text', nullable: true })
  bancoPayload?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

