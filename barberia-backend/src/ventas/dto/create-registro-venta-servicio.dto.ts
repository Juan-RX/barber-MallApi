import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para registrar una venta de servicio basado en el formato REG_VTA_SERV
 * Este formato viene del sistema externo y tiene campos específicos
 * Solo acepta exactamente estos 10 campos: id, user_id, store_id, service_external_id, 
 * service_price, apointment_date, apointment_time, duration_minutes, payment_status, payment_method
 */
export class CreateRegistroVentaServicioDto {
  @ApiProperty({
    description: 'ID de la venta (opcional, solo para actualizaciones)',
    example: 123,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiProperty({
    description: 'ID del usuario/cliente (código externo)',
    example: 'CLI-EXT-001',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'ID de la tienda/sucursal',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  store_id: number;

  @ApiProperty({
    description: 'ID externo del servicio (codigo_externo)',
    example: 'SRV003',
  })
  @IsString()
  @IsNotEmpty()
  service_external_id: string;

  @ApiProperty({
    description: 'Precio del servicio',
    example: 150,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  service_price: number;

  @ApiProperty({
    description: 'Fecha de la cita (formato YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsString()
  @IsNotEmpty()
  apointment_date: string;

  @ApiProperty({
    description: 'Hora de la cita (formato ISO 8601, YYYY-MM-DDTHH:mm:ss, o HH:mm)',
    example: '2025-01-15T18:00:00.000Z',
  })
  @IsString()
  @IsNotEmpty()
  apointment_time: string;

  @ApiProperty({
    description: 'Duración del servicio en minutos',
    example: 80,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  duration_minutes: number;

  @ApiProperty({
    description: 'Estado del pago (PENDIENTE, PAGADA, CANCELADA, etc.) - se mapea a estado_venta_id',
    example: 'PAGADA',
  })
  @IsString()
  @IsNotEmpty()
  payment_status: string;

  @ApiProperty({
    description: 'Método de pago (TARJETA, EFECTIVO, etc.)',
    example: 'TARJETA',
  })
  @IsString()
  @IsNotEmpty()
  payment_method: string;
}

