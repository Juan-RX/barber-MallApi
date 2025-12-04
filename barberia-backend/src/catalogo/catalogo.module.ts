import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';
import { Sucursal } from '../entities/sucursal.entity';
import { Servicio } from '../entities/servicio.entity';
import { Barbero } from '../entities/barbero.entity';
import { Inventario } from '../entities/inventario.entity';
import { Cliente } from '../entities/cliente.entity';
import { DisponibilidadModule } from '../disponibilidad/disponibilidad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sucursal, Servicio, Barbero, Inventario, Cliente]),
    DisponibilidadModule,
  ],
  controllers: [CatalogoController],
  providers: [CatalogoService],
  exports: [CatalogoService],
})
export class CatalogoModule {}

