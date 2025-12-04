import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ComprobantesService } from './comprobantes.service';
import { GenerarComprobanteDto } from './dto/generar-comprobante.dto';
import { Comprobante } from '../entities/comprobante.entity';

@ApiTags('Internos - Comprobantes')
@Controller('comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantesService: ComprobantesService) {}

  @Post('generar')
  @ApiOperation({ summary: 'Generar un comprobante para una venta' })
  @ApiResponse({ status: 201, description: 'Comprobante generado', type: Comprobante })
  generarComprobante(@Body() dto: GenerarComprobanteDto): Promise<Comprobante> {
    return this.comprobantesService.generar(dto);
  }

  @Get('venta/:ventaId')
  @ApiOperation({ summary: 'Obtener comprobantes por venta' })
  @ApiResponse({ status: 200, description: 'Lista de comprobantes', type: [Comprobante] })
  obtenerPorVenta(@Param('ventaId', ParseIntPipe) ventaId: number): Promise<Comprobante[]> {
    return this.comprobantesService.obtenerPorVenta(ventaId);
  }
}

