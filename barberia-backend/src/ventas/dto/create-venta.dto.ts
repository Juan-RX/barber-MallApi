import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVentaLineaDto } from './create-venta-linea.dto';

export class CreateVentaDto {
  @ApiProperty({ description: 'Código único de la orden', example: 'ORD-2024-001' })
  @IsString()
  @IsOptional()
  orderCode?: string;

  @ApiProperty({ description: 'ID del cliente', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  clienteId?: number;

  @ApiProperty({ description: 'ID de la sucursal', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  sucursalId: number;

  @ApiProperty({ description: 'ID del estado de venta', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  estadoVentaId: number;

  @ApiProperty({ description: 'Total bruto', example: 150.00, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  totalBruto?: number;

  @ApiProperty({ description: 'Descuento total', example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  descuentoTotal?: number;

  @ApiProperty({ description: 'Total neto', example: 150.00, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  totalNeto?: number;

  @ApiProperty({ description: 'Origen de la venta', example: 'LOCAL', default: 'LOCAL' })
  @IsString()
  @IsOptional()
  origen?: string;

  @ApiProperty({ description: 'Comentarios', example: 'Cliente regular', required: false })
  @IsString()
  @IsOptional()
  comentarios?: string;

  @ApiProperty({
    description: 'Líneas de venta',
    type: [CreateVentaLineaDto],
    example: [
      {
        tipoItem: 'SERVICIO',
        servicioId: 1,
        quantity: 1,
        priceUnit: 150.00,
        discountAmount: 0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaLineaDto)
  ventaLineas: CreateVentaLineaDto[];
}

