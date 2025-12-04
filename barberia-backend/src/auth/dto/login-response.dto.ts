import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Indica si el login fue exitoso',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Login exitoso',
  })
  message: string;

  @ApiProperty({
    description: 'Información del cliente (sin contraseña)',
    example: {
      clienteId: 1,
      nombre: 'Edgar Leal',
      email: 'edgar.leal@gmail.com',
      telefono: '6621234567',
      codigoExterno: 'CLI-EXT-001',
    },
    required: false,
  })
  cliente?: {
    clienteId: number;
    nombre: string;
    email?: string;
    telefono?: string;
    codigoExterno?: string;
  };

  @ApiProperty({
    description: 'Token de autenticación (opcional, para futuras implementaciones)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  token?: string;
}

