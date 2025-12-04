import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionesController } from './transacciones.controller';
import { TransaccionesService } from './transacciones.service';
import { TransaccionPago } from '../entities/transaccion-pago.entity';
import { Venta } from '../entities/venta.entity';
import { CatEstadoTransaccion } from '../entities/catestadotransaccion.entity';
import { CatEstadoVenta } from '../entities/catestadoventa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransaccionPago, Venta, CatEstadoTransaccion, CatEstadoVenta])],
  controllers: [TransaccionesController],
  providers: [TransaccionesService],
  exports: [TransaccionesService],
})
export class TransaccionesModule {}

