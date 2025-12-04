import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Cita } from './cita.entity';
import { Venta } from './venta.entity';

@Entity('cliente', { schema: 'barberia' })
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'codigo_externo', type: 'varchar', length: 20, unique: true, nullable: true })
  codigoExterno?: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Cita, (cita) => cita.cliente)
  citas: Cita[];

  @OneToMany(() => Venta, (venta) => venta.cliente)
  ventas: Venta[];
}

