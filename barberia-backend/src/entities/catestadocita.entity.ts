import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Cita } from './cita.entity';

@Entity('catestadocita', { schema: 'barberia' })
export class CatEstadoCita {
  @PrimaryGeneratedColumn({ name: 'estado_cita_id' })
  estadoCitaId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @OneToMany(() => Cita, (cita) => cita.estadoCita)
  citas: Cita[];
}

