import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const normalizarCampo = (...aliases: string[]) =>
  Transform(({ value, obj }) => {
    if (value !== undefined && value !== null) {
      return value;
    }
    for (const alias of aliases) {
      const aliasValue = obj?.[alias];
      if (aliasValue !== undefined && aliasValue !== null) {
        return aliasValue;
      }
    }
    return value;
  });

export class IniciarPagoDto {
  @ApiProperty({
    name: 'NumeroTarjetaOrigen',
    description: 'Identificador de la tarjeta origen según el banco',
    example: '4111111111111111',
  })
  @normalizarCampo('id_tarjeta_origen', 'numero_tarjeta_origen', 'NumeroTarjetaOrigen')
  @IsString()
  @IsNotEmpty()
  NumeroTarjetaOrigen: string;

  @ApiProperty({
    name: 'NumeroTarjetaDestino',
    description: 'Identificador de la tarjeta destino; si no se envía se usa la cuenta configurada',
    example: '5555555555554444',
    required: false,
  })
  @normalizarCampo('id_tarjeta_destino', 'numero_tarjeta_destino', 'NumeroTarjetaDestino')
  @IsString()
  @IsOptional()
  NumeroTarjetaDestino?: string;

  @ApiProperty({
    name: 'NombreCliente',
    description: 'Nombre del cliente registrado con la tarjeta',
    example: 'Juan Pérez',
    required: false,
  })
  @normalizarCampo('nombre', 'nombre_cliente', 'NombreCliente')
  @IsString()
  @IsOptional()
  NombreCliente?: string;

  @ApiProperty({
    name: 'MesExp',
    description: 'Mes de expiración de la tarjeta',
    example: 12,
  })
  @normalizarCampo('mes_exp', 'MesExp')
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  MesExp: number;

  @ApiProperty({
    name: 'AnioExp',
    description: 'Año de expiración de la tarjeta',
    example: 2027,
  })
  @normalizarCampo('anio_exp', 'AnioExp')
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  AnioExp: number;

  @ApiProperty({
    name: 'Cvv',
    description: 'Código de seguridad (CVV o CVC)',
    example: '123',
  })
  @normalizarCampo('cvv', 'Cvv')
  @IsString()
  @IsNotEmpty()
  Cvv: string;

  @ApiProperty({
    name: 'Monto',
    description: 'Monto a cobrar (por defecto se usa el total de la venta)',
    example: 300,
    required: false,
  })
  @normalizarCampo('monto', 'Monto')
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  Monto?: number;
}
