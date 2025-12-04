import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { Cliente } from '../entities/cliente.entity';

@ApiTags('Internos - Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado exitosamente',
    type: Cliente,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, código externo o email duplicado',
  })
  create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener clientes (permite filtros opcionales)' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filtrar por email exacto' })
  @ApiQuery({
    name: 'telefono',
    required: false,
    type: String,
    description: 'Filtrar por teléfono exacto',
  })
  @ApiQuery({
    name: 'codigoExterno',
    required: false,
    type: String,
    description: 'Filtrar por código externo exacto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    type: [Cliente],
  })
  findAll(
    @Query('email') email?: string,
    @Query('telefono') telefono?: string,
    @Query('codigoExterno') codigoExterno?: string,
  ): Promise<Cliente[]> {
    return this.clientesService.findAll({ email, telefono, codigoExterno });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: Cliente,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Cliente> {
    return this.clientesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un cliente',
    description:
      'Elimina un cliente solo si no tiene citas o ventas asociadas. ' +
      'Si el cliente tiene relaciones, se lanzará un error.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del cliente',
  })
  @ApiResponse({
    status: 204,
    description: 'Cliente eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el cliente porque tiene citas o ventas asociadas',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.clientesService.remove(id);
  }
}

