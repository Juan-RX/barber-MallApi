import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { Venta } from '../entities/venta.entity';
import { VentaLinea } from '../entities/venta-linea.entity';
import { Cliente } from '../entities/cliente.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { CatEstadoVenta } from '../entities/catestadoventa.entity';
import { Servicio } from '../entities/servicio.entity';
import { Producto } from '../entities/producto.entity';
import { Cita } from '../entities/cita.entity';
import { Comprobante } from '../entities/comprobante.entity';
import { TransaccionPago } from '../entities/transaccion-pago.entity';
import { CatEstadoTransaccion } from '../entities/catestadotransaccion.entity';
import { CitasModule } from '../citas/citas.module';
import { Barbero } from '../entities/barbero.entity';

@Module({
  imports: [
    CitasModule,
    TypeOrmModule.forFeature([
      Venta,
      VentaLinea,
      Cliente,
      Sucursal,
      CatEstadoVenta,
      Servicio,
      Producto,
      Cita,
      Barbero,
      Comprobante,
      TransaccionPago,
      CatEstadoTransaccion,
    ]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}

