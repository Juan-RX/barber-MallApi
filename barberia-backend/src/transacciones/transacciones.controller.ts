import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TransaccionesService } from './transacciones.service';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { TransaccionPago } from '../entities/transaccion-pago.entity';
import { IniciarPagoDto } from './dto/iniciar-pago.dto';

@ApiTags('Internos - Transacciones')
@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva transacción de pago' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente', type: TransaccionPago })
  @ApiResponse({ status: 404, description: 'Venta o estado de transacción no encontrado' })
  createTransaccion(@Body() createTransaccionDto: CreateTransaccionDto): Promise<TransaccionPago> {
    return this.transaccionesService.createTransaccion(createTransaccionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las transacciones' })
  @ApiQuery({ name: 'ventaId', required: false, type: Number, description: 'Filtrar por ID de venta' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones', type: [TransaccionPago] })
  findAllTransacciones(@Query('ventaId') ventaId?: string): Promise<TransaccionPago[]> {
    const ventaIdNum = ventaId ? parseInt(ventaId) : undefined;
    return this.transaccionesService.findAllTransacciones(ventaIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por ID' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada', type: TransaccionPago })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findTransaccionById(@Param('id', ParseIntPipe) id: number): Promise<TransaccionPago> {
    return this.transaccionesService.findTransaccionById(id);
  }

  @Get('external/:externalId')
  @ApiOperation({ summary: 'Obtener una transacción por ID externo' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada', type: TransaccionPago })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findTransaccionByExternalId(@Param('externalId') externalId: string): Promise<TransaccionPago> {
    return this.transaccionesService.findTransaccionByExternalId(externalId);
  }

  @Get('venta/:ventaId')
  @ApiOperation({ summary: 'Obtener todas las transacciones de una venta' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones de la venta', type: [TransaccionPago] })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  getTransaccionesPorVenta(@Param('ventaId', ParseIntPipe) ventaId: number): Promise<TransaccionPago[]> {
    return this.transaccionesService.getTransaccionesPorVenta(ventaId);
  }

  @Post('venta/:ventaId/pagar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar el pago de una venta contra el banco' })
  @ApiResponse({ status: 201, description: 'Pago procesado', type: TransaccionPago })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  iniciarPagoVenta(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Body() pagoDto: IniciarPagoDto,
  ): Promise<TransaccionPago> {
    return this.transaccionesService.iniciarPagoVenta(ventaId, pagoDto);
  }
}

