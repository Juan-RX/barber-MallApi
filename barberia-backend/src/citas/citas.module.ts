import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from '../entities/cita.entity';
import { Servicio } from '../entities/servicio.entity';
import { Barbero } from '../entities/barbero.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { Cliente } from '../entities/cliente.entity';
import { CatEstadoCita } from '../entities/catestadocita.entity';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { DisponibilidadModule } from '../disponibilidad/disponibilidad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cita, Servicio, Barbero, Sucursal, Cliente, CatEstadoCita]),
    DisponibilidadModule,
  ],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}

