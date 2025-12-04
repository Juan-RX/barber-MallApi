import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransaccionDto {
  @ApiProperty({ description: 'ID de la venta asociada', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  ventaId: number;

  @ApiProperty({ description: 'Código de negocio', example: 'BAR01' })
  @IsString()
  @IsNotEmpty()
  codigoNegocio: string;

  @ApiProperty({ description: 'ID externo de la transacción', example: 'TXN-EXT-12345' })
  @IsString()
  @IsNotEmpty()
  transaccionExternaId: string;

  @ApiProperty({ description: 'Monto de la transacción', example: 150.00 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  monto: number;

  @ApiProperty({ description: 'Descripción de la transacción', example: 'Pago de servicio de corte', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'ID del estado de transacción', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  estadoTxId: number;

  @ApiProperty({ description: 'Tipo reportado por el banco', example: 'TRANSFERENCIA', required: false })
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiProperty({ description: 'Número de tarjeta regresado por el banco', example: '****4444', required: false })
  @IsString()
  @IsOptional()
  numeroTarjeta?: string;

  @ApiProperty({
    description: 'Identificador de estado proporcionado por el banco',
    example: 'RECHAZADA',
    required: false,
  })
  @IsString()
  @IsOptional()
  estadoBancoId?: string;

  @ApiProperty({ description: 'Firma de la transacción enviada por el banco', required: false })
  @IsString()
  @IsOptional()
  firma?: string;

  @ApiProperty({
    description: 'Fecha de creación UTC informada por el banco',
    example: '2025-11-28T01:08:19.443Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  creadaUtc?: string;

  @ApiProperty({ description: 'Payload del banco', example: '{"status":"approved"}', required: false })
  @IsString()
  @IsOptional()
  bancoPayload?: string;
}