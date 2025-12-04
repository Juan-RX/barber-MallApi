import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO para asignar código externo a un servicio
 */
export class AssignCodigoExternoDto {
  @ApiProperty({
    description: 'Código externo a asignar',
    example: 'SRV-EXT-001',
  })
  @IsString()
  @IsNotEmpty()
  codigoExterno: string;
}

