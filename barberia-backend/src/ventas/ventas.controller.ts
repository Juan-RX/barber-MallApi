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
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { CreateRegistroVentaServicioDto } from './dto/create-registro-venta-servicio.dto';
import { RegistroVentaServicioResponseDto } from './dto/registro-venta-servicio-response.dto';
import { Venta } from '../entities/venta.entity';
import { VentaLinea } from '../entities/venta-linea.entity';
import { CancelarVentaDto } from './dto/cancelar-venta.dto';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @ApiTags('Mall - Ventas')
  @Post('registro-servicio')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una venta de servicio desde el mall (Interface 11 - REG_VTA_SERV)',
    description:
      'Registra una venta de servicio usando los campos específicos del formato REG_VTA_SERV. ' +
      'Busca el servicio por código externo (service_external_id) y crea automáticamente la venta y línea de venta. ' +
      'Retorna la información de la venta en formato esperado por el mall.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Venta registrada exitosamente', 
    type: RegistroVentaServicioResponseDto 
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, servicio no disponible en la sucursal, o código de orden duplicado',
  })
  @ApiResponse({
    status: 404,
    description: 'Servicio, cliente o sucursal no encontrado',
  })
  registrarVentaServicio(
    @Body() registroDto: CreateRegistroVentaServicioDto,
  ): Promise<RegistroVentaServicioResponseDto> {
    return this.ventasService.registrarVentaServicio(registroDto);
  }

  @ApiTags('Internos - Ventas')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una venta usando IDs internos (uso interno)',
    description:
      'Crea una venta y sus líneas usando IDs internos de servicios/productos. Ideal para operaciones locales.',
  })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente', type: Venta })
  @ApiResponse({ status: 400, description: 'Datos inválidos o código de orden duplicado' })
  @ApiResponse({ status: 404, description: 'Cliente, sucursal, estado o servicio/producto no encontrado' })
  createVenta(@Body() createVentaDto: CreateVentaDto): Promise<Venta> {
    return this.ventasService.createVenta(createVentaDto);
  }

  @ApiTags('Internos - Ventas')
  @Get()
  @ApiOperation({ summary: 'Obtener todas las ventas' })
  @ApiQuery({ name: 'sucursalId', required: false, type: Number, description: 'Filtrar por sucursal' })
  @ApiQuery({ name: 'clienteId', required: false, type: Number, description: 'Filtrar por cliente' })
  @ApiResponse({ status: 200, description: 'Lista de ventas', type: [Venta] })
  findAllVentas(
    @Query('sucursalId') sucursalId?: string,
    @Query('clienteId') clienteId?: string,
  ): Promise<Venta[]> {
    const sucursalIdNum = sucursalId ? parseInt(sucursalId) : undefined;
    const clienteIdNum = clienteId ? parseInt(clienteId) : undefined;
    return this.ventasService.findAllVentas(sucursalIdNum, clienteIdNum);
  }

  @ApiTags('Internos - Ventas')
  @Get('lineas')
  @ApiOperation({ summary: 'Obtener todas las líneas de venta' })
  @ApiResponse({ status: 200, description: 'Lista de líneas de venta', type: [VentaLinea] })
  findAllVentaLineas(): Promise<VentaLinea[]> {
    return this.ventasService.findAllVentaLineas();
  }

  @ApiTags('Internos - Ventas')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una venta por ID' })
  @ApiResponse({ status: 200, description: 'Venta encontrada', type: Venta })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  findVentaById(@Param('id', ParseIntPipe) id: number): Promise<Venta> {
    return this.ventasService.findVentaById(id);
  }

  @ApiTags('Internos - Ventas')
  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una venta y liberar sus citas asociadas' })
  @ApiResponse({ status: 200, description: 'Venta cancelada', type: Venta })
  cancelarVenta(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelarDto: CancelarVentaDto,
  ): Promise<Venta> {
    return this.ventasService.cancelarVenta(id, cancelarDto);
  }
}

