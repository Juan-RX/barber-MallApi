import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelarVentaDto {
  @ApiProperty({
    description: 'Motivo de la cancelación',
    example: 'El cliente abandonó el pago',
    required: false,
  })
  @IsString()
  @IsOptional()
  motivo?: string;
}

