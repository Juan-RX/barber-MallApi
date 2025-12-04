import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateHorarioBarberoDto {
  @ApiProperty({ description: 'ID del barbero', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  barberoId: number;

  @ApiProperty({ description: 'Día de la semana (1=Lunes, 2=Martes, ..., 7=Domingo)', example: 1, minimum: 1, maximum: 7 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(7)
  diaSemana: number;

  @ApiProperty({ description: 'Hora de inicio (formato HH:MM:SS)', example: '09:00:00' })
  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({ description: 'Hora de fin (formato HH:MM:SS)', example: '17:00:00' })
  @IsString()
  @IsNotEmpty()
  horaFin: string;

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

