import { ApiProperty } from '@nestjs/swagger';

export class DispFechaResponseDto {
  @ApiProperty({ description: 'ID del servicio', example: 3 })
  servicio_id: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio del slot disponible',
    example: '2025-12-23 09:00',
  })
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin del slot disponible',
    example: '2025-12-23 09:30',
  })
  fecha_fin: string;

  @ApiProperty({ description: 'Duración en minutos', example: 30 })
  duracion_minutos: number;

  @ApiProperty({
    description: 'Hora de la cita (formato HH:mm)',
    example: '09:00',
  })
  appointment_time: string;

  @ApiProperty({
    description: 'ID de la cita si ya existe una cita reservada (opcional)',
    example: null,
    required: false,
  })
  id_cita?: number | null;

  @ApiProperty({ description: 'ID del barbero disponible', example: 4 })
  id_bar: number;
}

