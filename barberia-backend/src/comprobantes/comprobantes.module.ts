import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comprobante } from '../entities/comprobante.entity';
import { Venta } from '../entities/venta.entity';
import { ComprobantesService } from './comprobantes.service';
import { ComprobantesController } from './comprobantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comprobante, Venta])],
  providers: [ComprobantesService],
  controllers: [ComprobantesController],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}

