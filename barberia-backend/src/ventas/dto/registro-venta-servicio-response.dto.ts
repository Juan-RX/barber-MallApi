import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para registro de venta de servicio desde el mall
 * Formato similar al SPA pero adaptado para barbería
 */
export class RegistroVentaServicioResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Cita registrada correctamente en Barbería',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la venta en el sistema de barbería',
    example: 17,
  })
  venta_id_barberia: number;

  @ApiProperty({
    description: 'Código de reserva único generado',
    example: 'BAR-20251130-17',
  })
  codigo_reserva: string;

  @ApiProperty({
    description: 'Código de orden de la venta (order_code)',
    example: 'ORD-1733014400000-123',
  })
  mall_order_id: string;

  @ApiProperty({
    description: 'Estado de la cita (RESERVADA, CONFIRMADA, CANCELADA, etc.)',
    example: 'CONFIRMADA',
  })
  estatus_cita: string;

  @ApiProperty({
    description: 'Fecha de la cita (formato YYYY-MM-DD)',
    example: '2025-11-30',
    required: false,
  })
  fecha_cita?: string;

  @ApiProperty({
    description: 'Hora de la cita (formato HH:mm:ss)',
    example: '16:00:00',
    required: false,
  })
  hora_cita?: string;

  @ApiProperty({
    description: 'Duración del servicio en minutos',
    example: 80,
  })
  duracion_minutos: number;
}

