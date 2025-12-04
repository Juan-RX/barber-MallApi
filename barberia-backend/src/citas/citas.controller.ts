import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { ReservarCitaDto } from './dto/reservar-cita.dto';
import { Cita } from '../entities/cita.entity';

@ApiTags('Internos - Citas')
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post('reservar')
  @ApiOperation({
    summary: 'Reservar un slot de cita',
    description:
      'Valida que el slot siga disponible y crea una cita en estado RESERVADA. Se debe enviar el barbero y el rango horario exacto devuelto por el endpoint de disponibilidad.',
  })
  @ApiResponse({ status: 201, description: 'Cita reservada', type: Cita })
  reservarCita(@Body() dto: ReservarCitaDto): Promise<Cita> {
    return this.citasService.reservarCita(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las citas' })
  @ApiResponse({ status: 200, description: 'Lista de citas', type: [Cita] })
  obtenerTodasLasCitas(): Promise<Cita[]> {
    return this.citasService.obtenerTodasLasCitas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una cita' })
  @ApiResponse({ status: 200, description: 'Cita encontrada', type: Cita })
  obtenerCita(@Param('id', ParseIntPipe) id: number): Promise<Cita> {
    return this.citasService.obtenerCitaPorId(id);
  }

  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una cita existente' })
  @ApiResponse({ status: 200, description: 'Cita cancelada', type: Cita })
  cancelarCita(@Param('id', ParseIntPipe) id: number): Promise<Cita> {
    return this.citasService.cancelarCita(id, 'Cancelada desde frontend');
  }
}

