import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Crea un nuevo cliente
   */
  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    // Validar que no exista un cliente con el mismo código externo si se proporciona
    if (createClienteDto.codigoExterno) {
      const clienteExistente = await this.clienteRepository.findOne({
        where: { codigoExterno: createClienteDto.codigoExterno },
      });
      if (clienteExistente) {
        throw new BadRequestException(
          `Ya existe un cliente con el código externo "${createClienteDto.codigoExterno}"`,
        );
      }
    }

    // Validar que no exista un cliente con el mismo email si se proporciona
    if (createClienteDto.email) {
      const clienteConEmail = await this.clienteRepository.findOne({
        where: { email: createClienteDto.email },
      });
      if (clienteConEmail) {
        throw new BadRequestException(
          `Ya existe un cliente con el email "${createClienteDto.email}"`,
        );
      }
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  /**
   * Obtiene clientes con filtros opcionales
   */
  async findAll(filters?: {
    email?: string;
    telefono?: string;
    codigoExterno?: string;
  }): Promise<Cliente[]> {
    const where: Record<string, string> = {};

    if (filters?.email) {
      where.email = filters.email;
    }
    if (filters?.telefono) {
      where.telefono = filters.telefono;
    }
    if (filters?.codigoExterno) {
      where.codigoExterno = filters.codigoExterno;
    }

    const hasFilters = Object.keys(where).length > 0;

    return await this.clienteRepository.find({
      where: hasFilters ? where : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene un cliente por ID
   */
  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { clienteId: id },
      relations: ['citas', 'ventas'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  /**
   * Actualiza un cliente
   */
  async update(id: number, updateClienteDto: Partial<CreateClienteDto>): Promise<Cliente> {
    const cliente = await this.findOne(id);

    // Validar que no exista otro cliente con el mismo código externo si se actualiza
    if (updateClienteDto.codigoExterno && updateClienteDto.codigoExterno !== cliente.codigoExterno) {
      const clienteExistente = await this.clienteRepository.findOne({
        where: { codigoExterno: updateClienteDto.codigoExterno },
      });
      if (clienteExistente && clienteExistente.clienteId !== id) {
        throw new BadRequestException(
          `Ya existe otro cliente con el código externo "${updateClienteDto.codigoExterno}"`,
        );
      }
    }

    // Validar que no exista otro cliente con el mismo email si se actualiza
    if (updateClienteDto.email && updateClienteDto.email !== cliente.email) {
      const clienteConEmail = await this.clienteRepository.findOne({
        where: { email: updateClienteDto.email },
      });
      if (clienteConEmail && clienteConEmail.clienteId !== id) {
        throw new BadRequestException(
          `Ya existe otro cliente con el email "${updateClienteDto.email}"`,
        );
      }
    }

    // Actualizar los campos
    Object.assign(cliente, updateClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  /**
   * Elimina un cliente
   */
  async remove(id: number): Promise<void> {
    const cliente = await this.findOne(id);

    // Verificar si el cliente tiene citas o ventas asociadas
    const clienteConRelaciones = await this.clienteRepository.findOne({
      where: { clienteId: id },
      relations: ['citas', 'ventas'],
    });

    if (clienteConRelaciones) {
      const tieneCitas = clienteConRelaciones.citas && clienteConRelaciones.citas.length > 0;
      const tieneVentas = clienteConRelaciones.ventas && clienteConRelaciones.ventas.length > 0;

      if (tieneCitas || tieneVentas) {
        throw new BadRequestException(
          `No se puede eliminar el cliente con ID ${id} porque tiene citas o ventas asociadas. ` +
            `Citas asociadas: ${tieneCitas ? clienteConRelaciones.citas.length : 0}, ` +
            `Ventas asociadas: ${tieneVentas ? clienteConRelaciones.ventas.length : 0}`,
        );
      }
    }

    await this.clienteRepository.remove(cliente);
  }
}

