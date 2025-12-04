import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, Matches } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Código externo del cliente (único)',
    example: 'CLI-EXT-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigoExterno?: string;

  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '5551234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^[0-9+\-\s()]*$/, {
    message: 'El teléfono debe contener solo números, espacios, guiones, paréntesis o el signo +',
  })
  telefono?: string;

  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'juan.perez@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Contraseña del cliente (opcional, solo para clientes con acceso al sistema)',
    example: 'password123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  password?: string;
}

