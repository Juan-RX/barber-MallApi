import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisponibilidadController } from './disponibilidad.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';
import { Servicio } from '../entities/servicio.entity';
import { Barbero } from '../entities/barbero.entity';
import { Cita } from '../entities/cita.entity';
import { Cliente } from '../entities/cliente.entity';
import { CatEstadoCita } from '../entities/catestadocita.entity';
import { Confirmacion } from '../entities/confirmacion.entity';
import { RecordatorioLog } from '../entities/recordatorio-log.entity';
import { HorarioSucursal } from '../entities/horario-sucursal.entity';
import { HorarioBarbero } from '../entities/horario-barbero.entity';
import { ExcepcionHorario } from '../entities/excepcion-horario.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { PausaBarbero } from '../entities/pausa-barbero.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Servicio,
      Barbero,
      Cita,
      Cliente,
      CatEstadoCita,
      Confirmacion,
      RecordatorioLog,
      HorarioSucursal,
      HorarioBarbero,
      ExcepcionHorario,
      Sucursal,
      PausaBarbero,
    ]),
  ],
  controllers: [DisponibilidadController, HorarioController],
  providers: [DisponibilidadService, HorarioService],
  exports: [DisponibilidadService, HorarioService],
})
export class DisponibilidadModule {}

