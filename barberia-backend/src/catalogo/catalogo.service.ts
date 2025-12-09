import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from '../entities/sucursal.entity';
import { Servicio } from '../entities/servicio.entity';
import { Barbero } from '../entities/barbero.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { ServicioMallDto } from './dto/servicio-mall.dto';
import { CatalogoResponseDto } from './dto/catalogo-response.dto';

@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Barbero)
    private barberoRepository: Repository<Barbero>,
  ) {}

  // ========== SUCURSALES ==========
  async createSucursal(createSucursalDto: CreateSucursalDto): Promise<Sucursal> {
    // Validar que no exista una sucursal con el mismo nombre
    const sucursalExistente = await this.sucursalRepository.findOne({
      where: { nombre: createSucursalDto.nombre },
    });
    if (sucursalExistente) {
      throw new BadRequestException(`Ya existe una sucursal con el nombre "${createSucursalDto.nombre}"`);
    }

    // Validar que no exista una sucursal con el mismo codigoNegocio
    const codigoExistente = await this.sucursalRepository.findOne({
      where: { codigoNegocio: createSucursalDto.codigoNegocio },
    });
    if (codigoExistente) {
      throw new BadRequestException(
        `Ya existe una sucursal con el código de negocio "${createSucursalDto.codigoNegocio}"`,
      );
    }

    // Validar mallStoreCode si se proporciona
    if (createSucursalDto.mallStoreCode) {
      const mallCodeExistente = await this.sucursalRepository.findOne({
        where: { mallStoreCode: createSucursalDto.mallStoreCode },
      });
      if (mallCodeExistente) {
        throw new BadRequestException(
          `Ya existe una sucursal con el código de mall "${createSucursalDto.mallStoreCode}"`,
        );
      }
    }

    const sucursal = this.sucursalRepository.create(createSucursalDto);
    return await this.sucursalRepository.save(sucursal);
  }

  async findAllSucursales(activo?: boolean): Promise<Sucursal[]> {
    const where = activo !== undefined ? { activo } : {};
    return await this.sucursalRepository.find({ where });
  }

  async findSucursalById(id: number): Promise<Sucursal> {
    const sucursal = await this.sucursalRepository.findOne({ where: { sucursalId: id } });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }
    return sucursal;
  }

  async updateSucursal(id: number, updateData: Partial<CreateSucursalDto>): Promise<Sucursal> {
    await this.findSucursalById(id);

    // Validar duplicados si se actualiza el nombre
    if (updateData.nombre) {
      const sucursalExistente = await this.sucursalRepository.findOne({
        where: { nombre: updateData.nombre },
      });
      if (sucursalExistente && sucursalExistente.sucursalId !== id) {
        throw new BadRequestException(`Ya existe una sucursal con el nombre "${updateData.nombre}"`);
      }
    }

    // Validar duplicados si se actualiza el codigoNegocio
    if (updateData.codigoNegocio) {
      const codigoExistente = await this.sucursalRepository.findOne({
        where: { codigoNegocio: updateData.codigoNegocio },
      });
      if (codigoExistente && codigoExistente.sucursalId !== id) {
        throw new BadRequestException(
          `Ya existe una sucursal con el código de negocio "${updateData.codigoNegocio}"`,
        );
      }
    }

    // Validar mallStoreCode si se actualiza
    if (updateData.mallStoreCode) {
      const mallCodeExistente = await this.sucursalRepository.findOne({
        where: { mallStoreCode: updateData.mallStoreCode },
      });
      if (mallCodeExistente && mallCodeExistente.sucursalId !== id) {
        throw new BadRequestException(
          `Ya existe una sucursal con el código de mall "${updateData.mallStoreCode}"`,
        );
      }
    }

    await this.sucursalRepository.update(id, updateData);
    return this.findSucursalById(id);
  }

  // ========== SERVICIOS ==========
  async createServicio(createServicioDto: CreateServicioDto): Promise<Servicio> {
    // Validar que no exista un servicio con el mismo nombre en la misma sucursal
    const where: any = { nombre: createServicioDto.nombre };
    if (createServicioDto.storeId) {
      where.storeId = createServicioDto.storeId;
    }

    const servicioExistente = await this.servicioRepository.findOne({ where });
    if (servicioExistente) {
      const mensaje = createServicioDto.storeId
        ? `Ya existe un servicio con el nombre "${createServicioDto.nombre}" en la sucursal ${createServicioDto.storeId}`
        : `Ya existe un servicio con el nombre "${createServicioDto.nombre}"`;
      throw new BadRequestException(mensaje);
    }

    // Validar codigoExterno si se proporciona
    if (createServicioDto.codigoExterno) {
      const codigoExistente = await this.servicioRepository.findOne({
        where: { codigoExterno: createServicioDto.codigoExterno },
      });
      if (codigoExistente) {
        throw new BadRequestException(
          `Ya existe un servicio con el código externo "${createServicioDto.codigoExterno}"`,
        );
      }
    }

    const servicio = this.servicioRepository.create(createServicioDto);
    return await this.servicioRepository.save(servicio);
  }

  async findAllServicios(sucursalId?: number, activo?: boolean): Promise<Servicio[]> {
    const where: any = {};
    if (sucursalId) where.storeId = sucursalId;
    if (activo !== undefined) where.activo = activo;
    return await this.servicioRepository.find({ where, relations: ['sucursal'] });
  }

  async findServicioById(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { servicioId: id },
      relations: ['sucursal'],
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return servicio;
  }

  async updateServicio(id: number, updateData: Partial<CreateServicioDto>): Promise<Servicio> {
    const servicioActual = await this.findServicioById(id);

    // Validar duplicados si se actualiza el nombre
    if (updateData.nombre) {
      const storeId = updateData.storeId !== undefined ? updateData.storeId : servicioActual.storeId;
      const where: any = { nombre: updateData.nombre };
      if (storeId) {
        where.storeId = storeId;
      }

      const servicioExistente = await this.servicioRepository.findOne({ where });
      if (servicioExistente && servicioExistente.servicioId !== id) {
        const mensaje = storeId
          ? `Ya existe un servicio con el nombre "${updateData.nombre}" en la sucursal ${storeId}`
          : `Ya existe un servicio con el nombre "${updateData.nombre}"`;
        throw new BadRequestException(mensaje);
      }
    }

    // Validar codigoExterno si se actualiza
    if (updateData.codigoExterno) {
      const codigoExistente = await this.servicioRepository.findOne({
        where: { codigoExterno: updateData.codigoExterno },
      });
      if (codigoExistente && codigoExistente.servicioId !== id) {
        throw new BadRequestException(
          `Ya existe un servicio con el código externo "${updateData.codigoExterno}"`,
        );
      }
    }

    await this.servicioRepository.update(id, updateData);
    return this.findServicioById(id);
  }

  // ========== BARBEROS ==========
  async createBarbero(createBarberoDto: CreateBarberoDto): Promise<Barbero> {
    // Validar que no exista un barbero con el mismo nombre en la misma sucursal
    if (createBarberoDto.sucursalId) {
      const barberoExistente = await this.barberoRepository.findOne({
        where: {
          nombre: createBarberoDto.nombre,
          sucursalId: createBarberoDto.sucursalId,
        },
      });
      if (barberoExistente) {
        throw new BadRequestException(
          `Ya existe un barbero con el nombre "${createBarberoDto.nombre}" en la sucursal ${createBarberoDto.sucursalId}`,
        );
      }
    }

    const barbero = this.barberoRepository.create(createBarberoDto);
    return await this.barberoRepository.save(barbero);
  }

  async findAllBarberos(sucursalId?: number, activo?: boolean): Promise<Barbero[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    if (activo !== undefined) where.activo = activo;
    return await this.barberoRepository.find({ where, relations: ['sucursal'] });
  }

  async findBarberoById(id: number): Promise<Barbero> {
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId: id },
      relations: ['sucursal'],
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${id} no encontrado`);
    }
    return barbero;
  }

  async updateBarbero(id: number, updateData: Partial<CreateBarberoDto>): Promise<Barbero> {
    const barberoActual = await this.findBarberoById(id);

    // Validar duplicados si se actualiza el nombre
    if (updateData.nombre) {
      const sucursalId = updateData.sucursalId !== undefined ? updateData.sucursalId : barberoActual.sucursalId;
      if (sucursalId) {
        const barberoExistente = await this.barberoRepository.findOne({
          where: {
            nombre: updateData.nombre,
            sucursalId: sucursalId,
          },
        });
        if (barberoExistente && barberoExistente.barberoId !== id) {
          throw new BadRequestException(
            `Ya existe un barbero con el nombre "${updateData.nombre}" en la sucursal ${sucursalId}`,
          );
        }
      }
    }

    await this.barberoRepository.update(id, updateData);
    return this.findBarberoById(id);
  }

  // ========== MÉTODOS PARA MALL ==========
  /**
   * Transforma un Servicio al formato esperado por el sistema mall
   * Excluye campos extra (codigoExterno, activo) y mapea nombres correctamente
   */
  transformarServicioParaMall(servicio: Servicio): ServicioMallDto {
    return {
      store_id: servicio.storeId || 0,
      id: servicio.servicioId,
      nombre: servicio.nombre,
      description: servicio.descripcion || undefined,
      precio: Number(servicio.precio),
      talla: servicio.talla || null,
      color: servicio.color || null,
      stock: servicio.stock || null,
      duracion_minutos: servicio.duracionMinutos,
      // NO incluye: codigoExterno, activo
    };
  }

  /**
   * Obtiene servicios en formato mall (solo campos que el mall espera)
   */
  async findAllServiciosParaMall(sucursalId?: number, activo?: boolean): Promise<ServicioMallDto[]> {
    const servicios = await this.findAllServicios(sucursalId, activo);
    return servicios.map((servicio) => this.transformarServicioParaMall(servicio));
  }

  /**
   * Obtiene un servicio por ID en formato mall
   */
  async findServicioParaMallById(id: number): Promise<ServicioMallDto> {
    const servicio = await this.findServicioById(id);
    return this.transformarServicioParaMall(servicio);
  }

  /**
   * Verifica si un servicio tiene código externo asignado
   */
  async verificarCodigoExternoServicio(servicioId: number): Promise<{ tieneCodigo: boolean; codigoExterno?: string }> {
    const servicio = await this.findServicioById(servicioId);
    return {
      tieneCodigo: !!servicio.codigoExterno,
      codigoExterno: servicio.codigoExterno || undefined,
    };
  }

  /**
   * Asigna o actualiza el código externo de un servicio
   */
  async asignarCodigoExternoServicio(servicioId: number, codigoExterno: string): Promise<Servicio> {
    // Verificar que el código no esté asignado a otro servicio
    const codigoExistente = await this.servicioRepository.findOne({
      where: { codigoExterno },
    });

    if (codigoExistente && codigoExistente.servicioId !== servicioId) {
      throw new BadRequestException(
        `Ya existe un servicio con el código externo "${codigoExterno}" (Servicio ID: ${codigoExistente.servicioId})`,
      );
    }

    return this.updateServicio(servicioId, { codigoExterno });
  }

  /**
   * Procesa solicitud de catálogo del mall (Interface 3 - SOLICITA_CATALOGO)
   * El mall no envía datos, solo realiza la solicitud
   * Retorna catálogo en formato Interface 4 - CATALOGO
   * Siempre retorna servicios de la sucursal 4 (store_id: 4)
   */
  async solicitarCatalogoMall(storeId?: number): Promise<CatalogoResponseDto[]> {
    // Siempre usar sucursal 4, ignorar el parámetro storeId
    const storeIdFijo = 4;
    
    // Validar que la sucursal 4 existe
    const sucursal = await this.findSucursalById(storeIdFijo);
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${storeIdFijo} no encontrada`);
    }

    // Obtener servicios activos de la sucursal 4
    const servicios = await this.servicioRepository.find({
      where: {
        activo: true,
        storeId: storeIdFijo,
      },
      relations: ['sucursal'],
    });

    // Transformar a formato Interface 4 - CATALOGO
    return servicios.map((servicio) => ({
      store_id: storeIdFijo,
      id: servicio.codigoExterno,
      nombre: servicio.nombre,
      description: servicio.descripcion || undefined,
      precio: Number(servicio.precio),
      talla: servicio.talla || null,
      color: servicio.color || null,
      stock: servicio.stock || null,
      duracion_minutos: servicio.duracionMinutos,
    }));
  }
}

