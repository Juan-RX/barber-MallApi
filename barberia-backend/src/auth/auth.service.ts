import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  // Lista de emails permitidos para acceso al sistema
  private readonly emailsPermitidos = [
    'edgar.leal@gmail.com',
    'javier.alvarado@gmail.com',
    'juan.pablo@gmail.com',
  ];

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Autentica un cliente mediante email y contraseña
   * Solo permite acceso a los emails en la lista permitida
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Validar que el email esté en la lista permitida
    if (!this.emailsPermitidos.includes(email.toLowerCase())) {
      throw new UnauthorizedException(
        'Acceso denegado. Este email no tiene permisos para acceder al sistema.',
      );
    }

    // Buscar el cliente por email
    const cliente = await this.clienteRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!cliente) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Validar que el cliente tenga contraseña configurada
    if (!cliente.password) {
      throw new UnauthorizedException(
        'Este cliente no tiene contraseña configurada. Contacte al administrador.',
      );
    }

    // Validar la contraseña (comparación directa por ahora, sin hash)
    if (cliente.password !== password) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Retornar información del cliente sin la contraseña
    return {
      success: true,
      message: 'Login exitoso',
      cliente: {
        clienteId: cliente.clienteId,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        codigoExterno: cliente.codigoExterno,
      },
    };
  }

  /**
   * Valida si un email está en la lista de emails permitidos
   */
  isEmailPermitido(email: string): boolean {
    return this.emailsPermitidos.includes(email.toLowerCase());
  }
}

