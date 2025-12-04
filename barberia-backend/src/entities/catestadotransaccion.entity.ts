import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TransaccionPago } from './transaccion-pago.entity';

@Entity('catestadotransaccion', { schema: 'barberia' })
export class CatEstadoTransaccion {
  @PrimaryGeneratedColumn({ name: 'estado_tx_id' })
  estadoTxId: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  descripcion: string;

  @OneToMany(() => TransaccionPago, (transaccion) => transaccion.estadoTx)
  transacciones: TransaccionPago[];
}

