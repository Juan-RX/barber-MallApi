import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreatePausaBarberoDto {
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

  @ApiProperty({ description: 'Hora de inicio de la pausa (formato HH:MM:SS)', example: '13:00:00' })
  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({ description: 'Hora de fin de la pausa (formato HH:MM:SS)', example: '14:00:00' })
  @IsString()
  @IsNotEmpty()
  horaFin: string;

  @ApiProperty({ description: 'Motivo de la pausa', example: 'Comida', required: false })
  @IsString()
  @IsOptional()
  motivo?: string;

  @ApiProperty({ description: 'Estado activo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

