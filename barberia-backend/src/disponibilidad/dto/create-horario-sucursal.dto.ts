import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateHorarioSucursalDto {
  @ApiProperty({ description: 'ID de la sucursal', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  sucursalId: number;

  @ApiProperty({ description: 'Día de la semana (1=Lunes, 2=Martes, ..., 7=Domingo)', example: 1, minimum: 1, maximum: 7 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(7)
  diaSemana: number;

  @ApiProperty({ description: 'Hora de apertura (formato HH:MM:SS)', example: '09:00:00' })
  @IsString()
  @IsNotEmpty()
  horaApertura: string;

  @ApiProperty({ description: 'Hora de cierre (formato HH:MM:SS)', example: '19:00:00' })
  @IsString()
  @IsNotEmpty()
  horaCierre: string;

  @ApiProperty({ description: 'Indica si la sucursal está cerrada este día', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  esCerrado?: boolean;

  @ApiProperty({ description: 'Estado activo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiProperty({ description: 'Fecha de inicio del horario (para horarios temporales)', example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiProperty({ description: 'Fecha de fin del horario (para horarios temporales)', example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}

