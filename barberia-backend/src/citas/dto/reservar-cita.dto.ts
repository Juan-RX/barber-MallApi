import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ReservarCitaDto {
  @ApiProperty({ description: 'ID del servicio a reservar', example: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  servicioId: number;

  @ApiProperty({ description: 'ID de la sucursal', example: 3 })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  sucursalId: number;

  @ApiProperty({ description: 'ID del barbero asignado al slot', example: 5 })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  barberoId: number;

  @ApiProperty({ description: 'ID del cliente (opcional si aún no se registra)', example: 10, required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  clienteId?: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio del slot (ISO 8601)',
    example: '2025-11-28T03:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin del slot (ISO 8601)',
    example: '2025-11-28T03:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @ApiProperty({
    description: 'Origen de la cita (MALL, LOCAL, WEB, etc.)',
    example: 'MALL',
    required: false,
  })
  @IsString()
  @IsOptional()
  origen?: string;

  @ApiProperty({
    description: 'Identificador del slot entregado por el mall',
    required: false,
  })
  @IsString()
  @IsOptional()
  slotIdMall?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    required: false,
  })
  @IsString()
  @IsOptional()
  notas?: string;
}

