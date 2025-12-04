import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { parseFechaAmigable } from '../utils/date-parser.util';

export class CheckDisponibilidadDto {
  @ApiProperty({
    description: 'ID del servicio',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  servicioId: number;

  @ApiProperty({
    description: 'ID de la sucursal',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  sucursalId: number;

  @ApiProperty({
    description: 'Fecha de inicio para buscar disponibilidad. Formatos aceptados: "2024-12-23", "2024-12-23 09:00", "2024-12-23T09:00"',
    example: '2024-12-23',
    examples: {
      soloFecha: { value: '2024-12-23', description: 'Solo fecha (inicio del día)' },
      fechaHora: { value: '2024-12-23 09:00', description: 'Fecha y hora con espacio' },
      iso: { value: '2024-12-23T09:00', description: 'Formato ISO sin Z' },
    },
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    try {
      const date = parseFechaAmigable(value);
      return date.toISOString();
    } catch (error) {
      return value; // Dejar que la validación del servicio maneje el error
    }
  })
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha de fin para buscar disponibilidad. Formatos aceptados: "2024-12-25", "2024-12-25 19:00", "2024-12-25T19:00"',
    example: '2024-12-25',
    examples: {
      soloFecha: { value: '2024-12-25', description: 'Solo fecha (fin del día)' },
      fechaHora: { value: '2024-12-25 19:00', description: 'Fecha y hora con espacio' },
      iso: { value: '2024-12-25T19:00', description: 'Formato ISO sin Z' },
    },
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    try {
      const date = parseFechaAmigable(value);
      // Si solo se proporciona fecha, establecer a fin del día
      if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        date.setHours(23, 59, 59, 999);
      }
      return date.toISOString();
    } catch (error) {
      return value; // Dejar que la validación del servicio maneje el error
    }
  })
  fechaFin: string;

  @ApiProperty({
    description: 'ID del barbero (opcional). Si no se especifica, busca en todos los barberos de la sucursal',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  barberoId?: number;
}

