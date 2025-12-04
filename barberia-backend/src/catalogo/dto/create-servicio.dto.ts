import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateServicioDto {
  @ApiProperty({ description: 'ID de la sucursal', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  storeId?: number;

  @ApiProperty({ description: 'Nombre del servicio', example: 'Corte de cabello' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Descripción del servicio', example: 'Corte de cabello clásico', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Precio del servicio', example: 150.00 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  precio: number;

  @ApiProperty({ description: 'Talla del servicio (si aplica)', example: null, required: false })
  @IsString()
  @IsOptional()
  talla?: string;

  @ApiProperty({ description: 'Color del servicio (si aplica)', example: null, required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Stock del servicio (si aplica)', example: null, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiProperty({ description: 'Duración en minutos', example: 30 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  duracionMinutos: number;

  @ApiProperty({ description: 'Código externo', example: 'SRV001', required: false })
  @IsString()
  @IsOptional()
  codigoExterno?: string;

  @ApiProperty({ description: 'Estado activo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

