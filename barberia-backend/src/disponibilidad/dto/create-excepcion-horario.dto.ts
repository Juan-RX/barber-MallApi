import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { TipoExcepcion } from '../../entities/excepcion-horario.entity';

export class CreateExcepcionHorarioDto {
  @ApiProperty({
    description: 'Tipo de excepción',
    enum: TipoExcepcion,
    example: TipoExcepcion.BARBERO_AUSENTE,
  })
  @IsEnum(TipoExcepcion)
  @IsNotEmpty()
  tipo: TipoExcepcion;

  @ApiProperty({ description: 'ID de la sucursal (opcional, según el tipo)', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sucursalId?: number;

  @ApiProperty({ description: 'ID del barbero (opcional, según el tipo)', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  barberoId?: number;

  @ApiProperty({ description: 'Fecha de inicio de la excepción', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de fin de la excepción (opcional, para rangos)', example: '2024-01-20', required: false })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiProperty({ description: 'Hora de inicio (para horarios especiales)', example: '10:00:00', required: false })
  @IsString()
  @IsOptional()
  horaInicio?: string;

  @ApiProperty({ description: 'Hora de fin (para horarios especiales)', example: '20:00:00', required: false })
  @IsString()
  @IsOptional()
  horaFin?: string;

  @ApiProperty({ description: 'Motivo de la excepción', example: 'Vacaciones', required: false })
  @IsString()
  @IsOptional()
  motivo?: string;

  @ApiProperty({ description: 'Estado activo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

