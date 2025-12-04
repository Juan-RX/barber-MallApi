import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerarComprobanteDto {
  @ApiProperty({ description: 'ID de la venta', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  ventaId: number;

  @ApiProperty({ description: 'Serie del comprobante', example: 'WEB', required: false })
  @IsString()
  @IsOptional()
  serie?: string;

  @ApiProperty({ description: 'Folio del comprobante', example: 'ORD-123-456', required: false })
  @IsString()
  @IsOptional()
  folio?: string;
}

