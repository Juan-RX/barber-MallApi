import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVentaLineaDto {
  @ApiProperty({ description: 'Tipo de item', enum: ['SERVICIO', 'PRODUCTO'], example: 'SERVICIO' })
  @IsEnum(['SERVICIO', 'PRODUCTO'])
  @IsNotEmpty()
  tipoItem: 'SERVICIO' | 'PRODUCTO';

  @ApiProperty({ description: 'ID del servicio (requerido si tipoItem es SERVICIO)', example: 1, required: false })
  @ValidateIf((o) => o.tipoItem === 'SERVICIO')
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  servicioId?: number;

  @ApiProperty({ description: 'ID del producto (requerido si tipoItem es PRODUCTO)', example: 1, required: false })
  @ValidateIf((o) => o.tipoItem === 'PRODUCTO')
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  productoId?: number;

  @ApiProperty({ description: 'ID de la cita asociada', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  citaId?: number;

  @ApiProperty({ description: 'Cantidad', example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiProperty({ description: 'Precio unitario', example: 150.00 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  priceUnit: number;

  @ApiProperty({ description: 'Monto de descuento', example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @ApiProperty({ description: 'ID externo del servicio', example: 'SRV-EXT-001', required: false })
  @IsString()
  @IsOptional()
  serviceExternalId?: string;

  @ApiProperty({ description: 'ID externo del producto', example: 'PROD-EXT-001', required: false })
  @IsString()
  @IsOptional()
  productExternalId?: string;

  @ApiProperty({ description: 'Fecha y hora de la cita', example: '2024-01-15T10:00:00Z', required: false })
  @IsString()
  @IsOptional()
  appointmentTime?: string;

  @ApiProperty({ description: 'Talla (para productos)', example: '250ml', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ description: 'Color (para productos)', example: 'Negro', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Opciones adicionales', example: 'Sin fragancia', required: false })
  @IsString()
  @IsOptional()
  options?: string;
}

