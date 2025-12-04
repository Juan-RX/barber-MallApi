import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venta } from './venta.entity';

@Entity('comprobante', { schema: 'barberia' })
export class Comprobante {
  @PrimaryGeneratedColumn({ name: 'comprobante_id' })
  comprobanteId: number;

  @Column({ name: 'venta_id' })
  ventaId: number;

  @ManyToOne(() => Venta, (venta) => venta.comprobantes)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @CreateDateColumn({ name: 'fecha_generacion', type: 'timestamptz' })
  fechaGeneracion: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  serie?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  folio?: string;
}

