import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateFormat } from './validators/is-date-format.validator';

/**
 * DTO para solicitud de disponibilidad de fechas del mall (Interface 9 - SOL_DISP_FECHA)
 * Formato esperado del mall según especificación
 */
export class SolDispFechaDto {
  @ApiProperty({
    description: 'ID de la sucursal',
    example: 3,
    default: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  store_id: number;

  @ApiProperty({
    description: 'ID externo del servicio (codigo_externo)',
    example: 'SRV003',
    default: 'SRV003',
  })
  @IsString()
  @IsNotEmpty()
  service_external_id: string;

  @ApiProperty({
    description: 'Fecha de la cita (formato YYYY-MM-DD). Debe ser una fecha válida entre 1900 y 2100',
    example: '2025-12-23',
    default: '2025-12-23',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateFormat({
    message: 'La fecha debe estar en formato YYYY-MM-DD y ser una fecha válida (ej: 2025-12-23)',
  })
  appointment_date: string;
}

