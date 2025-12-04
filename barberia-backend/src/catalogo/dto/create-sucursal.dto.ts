import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSucursalDto {
  @ApiProperty({ description: 'Nombre de la sucursal', example: 'Barbería Centro' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Dirección de la sucursal', example: 'Av. Principal 123', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'Código del mall/store', example: 'MALL001', required: false })
  @IsString()
  @IsOptional()
  mallStoreCode?: string;

  @ApiProperty({ description: 'Código de negocio único', example: 'BAR01' })
  @IsString()
  @IsNotEmpty()
  codigoNegocio: string;

  @ApiProperty({ description: 'Estado activo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

