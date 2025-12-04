import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Venta } from './venta.entity';

@Entity('catestadoventa', { schema: 'barberia' })
export class CatEstadoVenta {
  @PrimaryGeneratedColumn({ name: 'estado_venta_id' })
  estadoVentaId: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  descripcion: string;

  @OneToMany(() => Venta, (venta) => venta.estadoVenta)
  ventas: Venta[];
}

