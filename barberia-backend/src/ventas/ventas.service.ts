import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Venta } from '../entities/venta.entity';
import { VentaLinea } from '../entities/venta-linea.entity';
import { Cliente } from '../entities/cliente.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { CatEstadoVenta } from '../entities/catestadoventa.entity';
import { Servicio } from '../entities/servicio.entity';
import { Producto } from '../entities/producto.entity';
import { Cita } from '../entities/cita.entity';
import { Barbero } from '../entities/barbero.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { CreateRegistroVentaServicioDto } from './dto/create-registro-venta-servicio.dto';
import { RegistroVentaServicioResponseDto } from './dto/registro-venta-servicio-response.dto';
import { CitasService } from '../citas/citas.service';
import { CancelarVentaDto } from './dto/cancelar-venta.dto';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(VentaLinea)
    private ventaLineaRepository: Repository<VentaLinea>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
    @InjectRepository(CatEstadoVenta)
    private estadoVentaRepository: Repository<CatEstadoVenta>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(Cita)
    private citaRepository: Repository<Cita>,
    @InjectRepository(Barbero)
    private barberoRepository: Repository<Barbero>,
    private dataSource: DataSource,
    private citasService: CitasService,
  ) {}

  async findAllVentas(sucursalId?: number, clienteId?: number): Promise<Venta[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    if (clienteId) where.clienteId = clienteId;

    const ventas = await this.ventaRepository.find({
      where,
      relations: ['cliente', 'sucursal', 'estadoVenta', 'ventaLineas', 'ventaLineas.servicio', 'ventaLineas.producto'],
      order: { createdAt: 'DESC' },
    });

    // Limpiar respuestas
    return ventas.map((venta) => this.limpiarRespuestaVenta(venta));
  }

  /**
   * Obtiene todas las líneas de venta con sus relaciones
   */
  async findAllVentaLineas(): Promise<VentaLinea[]> {
    return await this.ventaLineaRepository.find({
      relations: ['venta', 'servicio', 'producto', 'cita'],
      order: { createdAt: 'DESC' },
    });
  }

  async findVentaById(id: number): Promise<Venta> {
    const venta = await this.ventaRepository.findOne({
      where: { ventaId: id },
      relations: ['cliente', 'sucursal', 'estadoVenta', 'ventaLineas', 'ventaLineas.servicio', 'ventaLineas.producto', 'ventaLineas.cita'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return this.limpiarRespuestaVenta(venta);
  }

  async updateVenta(id: number, updateData: Partial<CreateVentaDto>): Promise<Venta> {
    await this.findVentaById(id);

    if (updateData.estadoVentaId) {
      const estadoVenta = await this.estadoVentaRepository.findOne({
        where: { estadoVentaId: updateData.estadoVentaId },
      });
      if (!estadoVenta) {
        throw new NotFoundException(`Estado de venta con ID ${updateData.estadoVentaId} no encontrado`);
      }
    }

    await this.ventaRepository.update(id, updateData);
    const ventaActualizada = await this.ventaRepository.findOne({
      where: { ventaId: id },
      relations: ['cliente', 'sucursal', 'estadoVenta', 'ventaLineas', 'ventaLineas.servicio', 'ventaLineas.producto', 'ventaLineas.cita'],
    });

    if (!ventaActualizada) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return this.limpiarRespuestaVenta(ventaActualizada);
  }

  /**
   * Genera un email único para clientes del mall
   */
  private async generarEmailUnico(codigoExterno: string): Promise<string> {
    // Normalizar código externo para email (quitar guiones, convertir a minúsculas)
    const codigoNormalizado = codigoExterno.replace(/-/g, '').toLowerCase();
    let email = `mall-${codigoNormalizado}@barberia.com`;
    let intentos = 0;
    
    // Verificar que el email no exista
    while (intentos < 100) {
      const clienteExistente = await this.clienteRepository.findOne({
        where: { email },
      });
      
      if (!clienteExistente) {
        return email;
      }
      
      // Si existe, agregar un número al final
      email = `mall-${codigoNormalizado}${intentos + 1}@barberia.com`;
      intentos++;
    }
    
    // Si después de 100 intentos no se encuentra uno único, usar timestamp
    const timestamp = Date.now();
    return `mall-${codigoNormalizado}-${timestamp}@barberia.com`;
  }

  /**
   * Genera un teléfono único para clientes del mall con prefijo 662
   */
  private async generarTelefonoUnico(): Promise<string> {
    const prefijo = '662';
    let intentos = 0;
    const maxIntentos = 1000; // Aumentar intentos porque ahora es aleatorio
    
    while (intentos < maxIntentos) {
      // Generar 7 dígitos aleatorios
      const digitosAleatorios = Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(7, '0');
      
      const telefono = `${prefijo}${digitosAleatorios}`;
      
      // Verificar que el teléfono no exista
      const clienteExistente = await this.clienteRepository.findOne({
        where: { telefono },
      });
      
      if (!clienteExistente) {
        return telefono;
      }
      
      intentos++;
    }
    
    // Si después de muchos intentos no se encuentra uno único, usar timestamp
    const timestamp = Date.now().toString().slice(-7);
    return `${prefijo}${timestamp}`;
  }

  /**
   * Genera el siguiente código externo en formato CLI-EXT-XXX
   * Busca el último código existente y lo incrementa
   */
  private async generarCodigoExternoCliente(): Promise<string> {
    // Buscar todos los clientes con código externo que empiecen con "CLI-EXT-"
    const clientesConCodigo = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.codigo_externo LIKE :pattern', { pattern: 'CLI-EXT-%' })
      .orderBy('cliente.codigo_externo', 'DESC')
      .getMany();

    let siguienteNumero = 1;

    if (clientesConCodigo.length > 0) {
      // Extraer el número más alto de los códigos existentes
      const numeros = clientesConCodigo
        .map((c) => {
          const match = c.codigoExterno?.match(/CLI-EXT-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);

      if (numeros.length > 0) {
        siguienteNumero = Math.max(...numeros) + 1;
      }
    }

    // Generar código con formato CLI-EXT-XXX (3 dígitos)
    return `CLI-EXT-${siguienteNumero.toString().padStart(3, '0')}`;
  }

  /**
   * Registra una venta de servicio usando el formato REG_VTA_SERV (basado en la imagen proporcionada)
   * Este método busca el servicio por código externo y crea la venta automáticamente
   */
  async registrarVentaServicio(registroDto: CreateRegistroVentaServicioDto): Promise<RegistroVentaServicioResponseDto> {
    // 1. Buscar o crear el servicio usando los datos del body
    let servicio = await this.servicioRepository.findOne({
      where: { codigoExterno: registroDto.service_external_id },
    });

    if (!servicio) {
      // Si no existe, crear el servicio con los datos del body
      servicio = this.servicioRepository.create({
        codigoExterno: registroDto.service_external_id,
        nombre: registroDto.service_name,
        descripcion: registroDto.service_description,
        precio: registroDto.service_price,
        duracionMinutos: registroDto.duration_minutes,
        activo: true,
      });
      servicio = await this.servicioRepository.save(servicio);
    } else {
      // Si existe, actualizar con los datos del body
      servicio.nombre = registroDto.service_name;
      if (registroDto.service_description) {
        servicio.descripcion = registroDto.service_description;
      }
      servicio.precio = registroDto.service_price;
      servicio.duracionMinutos = registroDto.duration_minutes;
      servicio = await this.servicioRepository.save(servicio);
    }

    // 2. Buscar cliente por user_id o generar código externo automático
    // Primero intentar usar el user_id como codigo_externo si existe
    let cliente = await this.clienteRepository.findOne({
      where: { codigoExterno: registroDto.user_id },
    });

    if (!cliente) {
      // Si no existe, generar código externo automático en formato CLI-EXT-XXX
      const codigoExternoGenerado = await this.generarCodigoExternoCliente();
      
      // Verificar que el código generado tampoco exista (por si acaso)
      cliente = await this.clienteRepository.findOne({
        where: { codigoExterno: codigoExternoGenerado },
      });

      if (!cliente) {
        // Crear cliente automáticamente para usuarios del mall
        const emailUnico = await this.generarEmailUnico(codigoExternoGenerado);
        const telefonoUnico = await this.generarTelefonoUnico();
        
        cliente = this.clienteRepository.create({
          codigoExterno: codigoExternoGenerado,
          nombre: `Usuario Mall - ${codigoExternoGenerado}`,
          email: emailUnico,
          telefono: telefonoUnico,
        });
        cliente = await this.clienteRepository.save(cliente);
      }
    }

    // 3. Validar sucursal (store_id)
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalId: registroDto.store_id },
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${registroDto.store_id} no encontrada`);
    }

    // Asignar el servicio a la sucursal si no está asignado
    if (!servicio.storeId) {
      servicio.storeId = registroDto.store_id;
      servicio = await this.servicioRepository.save(servicio);
    } else if (servicio.storeId !== registroDto.store_id) {
      // Si está asignado a otra sucursal, permitir pero actualizar
      servicio.storeId = registroDto.store_id;
      servicio = await this.servicioRepository.save(servicio);
    }

    // 4. Obtener estado de venta: mapear payment_status (string) a estado_venta_id (number)
    let estadoVentaId: number;
    
    if (registroDto.payment_status) {
      // Buscar estado por código (payment_status)
      const estadoVenta = await this.estadoVentaRepository.findOne({
        where: { codigo: registroDto.payment_status.toUpperCase() },
      });
      if (!estadoVenta) {
        throw new NotFoundException(
          `Estado de venta con código "${registroDto.payment_status}" no encontrado. Estados disponibles: PENDIENTE, PAGADA, CANCELADA, etc.`,
        );
      }
      estadoVentaId = estadoVenta.estadoVentaId;
    } else {
      // Si no se proporciona payment_status, buscar estado por defecto (PENDIENTE)
      const estadoDefault = await this.estadoVentaRepository.findOne({
        where: { codigo: 'PENDIENTE' },
      });
      if (!estadoDefault) {
        // Si no existe PENDIENTE, tomar el primero disponible
        const primerEstado = await this.estadoVentaRepository.find({ take: 1 });
        if (primerEstado.length === 0) {
          throw new BadRequestException('No hay estados de venta configurados en el sistema');
        }
        estadoVentaId = primerEstado[0].estadoVentaId;
      } else {
        estadoVentaId = estadoDefault.estadoVentaId;
      }
    }

    // 5. Generar order_code automáticamente (SIEMPRE se genera, no se acepta del request)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    let orderCode = `ORD-${timestamp}-${random}`;
    
    // Asegurar que el orderCode generado sea único (reintentar si existe)
    let intentos = 0;
    while (intentos < 10) {
      const ventaExistente = await this.ventaRepository.findOne({
        where: { orderCode },
      });
      if (!ventaExistente) {
        break; // El código es único, continuar
      }
      // Si existe, generar uno nuevo
      const nuevoTimestamp = Date.now();
      const nuevoRandom = Math.floor(Math.random() * 1000);
      orderCode = `ORD-${nuevoTimestamp}-${nuevoRandom}`;
      intentos++;
    }

    // 6. Procesar appointment_time
    // Si se proporciona apointment_date pero no apointment_time, usar la fecha con hora 00:00:00
    // Si se proporciona apointment_time, usarlo directamente
    // Acepta formato "HH:mm" (ej: "16:00") o formato ISO completo
    let appointmentTime: Date | undefined;
    if (registroDto.apointment_time) {
      const timeStr = registroDto.apointment_time.trim();
      // Verificar si es formato "HH:mm" (ej: "16:00")
      const horaSimpleRegex = /^(\d{1,2}):(\d{2})$/;
      const match = timeStr.match(horaSimpleRegex);
      
      if (match) {
        // Es formato "HH:mm", combinar con fecha
        const horas = parseInt(match[1], 10);
        const minutos = parseInt(match[2], 10);
        
        if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
          throw new BadRequestException('El formato de apointment_time no es válido. Hora debe estar entre 00:00 y 23:59');
        }
        
        // Usar apointment_date si está presente, sino usar fecha actual
        const fechaBase = registroDto.apointment_date 
          ? registroDto.apointment_date 
          : new Date().toISOString().split('T')[0];
        
        appointmentTime = new Date(`${fechaBase}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);
        if (isNaN(appointmentTime.getTime())) {
          throw new BadRequestException('El formato de apointment_time no es válido');
        }
      } else {
        // Formato ISO completo o otro formato
        appointmentTime = new Date(registroDto.apointment_time);
        if (isNaN(appointmentTime.getTime())) {
          throw new BadRequestException('El formato de apointment_time no es válido');
        }
      }
    } else if (registroDto.apointment_date) {
      // Si solo se proporciona la fecha, usar medianoche de esa fecha
      appointmentTime = new Date(`${registroDto.apointment_date}T00:00:00`);
      if (isNaN(appointmentTime.getTime())) {
        throw new BadRequestException('El formato de apointment_date no es válido');
      }
    }

    // 7. Usar precio proporcionado directamente del body
    const precioProporcionado = registroDto.service_price;

    // 9. Calcular totales
    const quantity = registroDto.quantity || 1;
    const discountAmount = registroDto.discount_amount || 0;
    const totalBruto = precioProporcionado * quantity;
    const totalNeto = totalBruto - discountAmount;

    // 10. Asegurar que orderCode siempre tenga un valor válido
    if (!orderCode || (typeof orderCode === 'string' && orderCode.trim() === '')) {
      // Si por alguna razón orderCode no tiene valor, generarlo nuevamente
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      orderCode = `ORD-${timestamp}-${random}`;
    }

    const reservaMall = await this.asegurarCitaParaVentaMall({
      servicio,
      sucursalId: registroDto.store_id,
      clienteId: cliente.clienteId,
      appointmentTime,
    });
    const citaMall = reservaMall?.cita || null;
    const citaMallEsNueva = reservaMall?.esNueva ?? false;

    // 11. Crear venta y línea en una transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear la venta
      const venta = queryRunner.manager.create(Venta, {
        orderCode,
        clienteId: cliente.clienteId,
        sucursalId: registroDto.store_id,
        estadoVentaId,
        totalBruto,
        descuentoTotal: discountAmount,
        totalNeto,
        origen: registroDto.origen || 'MALL',
        comentarios: registroDto.comentarios,
      });

      const ventaGuardada = await queryRunner.manager.save(venta);

      // Generar confirmation_code con el ventaId real y confirmation_code_created_at con el createdAt real
      const confirmationCode = `CONF-${ventaGuardada.ventaId}-${Date.now()}`;
      const confirmationCodeCreatedAt = `${confirmationCode}-${ventaGuardada.createdAt.toISOString()}`;
      await queryRunner.manager.update(Venta, ventaGuardada.ventaId, {
        confirmationCode,
        confirmationCodeCreatedAt,
      });
      ventaGuardada.confirmationCode = confirmationCode;
      ventaGuardada.confirmationCodeCreatedAt = confirmationCodeCreatedAt;

      // Crear la línea de venta
      const priceTotal = totalNeto;

      const ventaLinea = queryRunner.manager.create(VentaLinea, {
        ventaId: ventaGuardada.ventaId,
        tipoItem: 'SERVICIO',
        servicioId: servicio.servicioId,
        quantity,
        priceUnit: precioProporcionado,
        discountAmount,
        priceTotal,
        serviceExternalId: registroDto.service_external_id,
        appointmentTime: citaMall?.fechaInicio ?? appointmentTime,
        citaId: citaMall?.citaId,
        // Los campos service_name, service_description, duration no se guardan directamente
        // pero están disponibles en la relación con el servicio
      });

      await queryRunner.manager.save(ventaLinea);

      await queryRunner.commitTransaction();

      // Retornar venta con relaciones completas
      const ventaCompleta = await this.ventaRepository.findOne({
        where: { ventaId: ventaGuardada.ventaId },
        relations: [
          'cliente',
          'sucursal',
          'estadoVenta',
          'ventaLineas',
          'ventaLineas.servicio',
          'ventaLineas.producto',
          'ventaLineas.cita',
          'transacciones',
          'transacciones.estadoTx',
        ],
      });

      if (!ventaCompleta) {
        throw new NotFoundException('Error al recuperar la venta creada');
      }

      // Si el estado de la venta es CANCELADA, cancelar la cita en lugar de confirmarla
      if (citaMall) {
        if (ventaCompleta.estadoVenta?.codigo === 'CANCELADA') {
          await this.citasService.cancelarCita(citaMall.citaId, 'Venta cancelada desde mall');
        } else {
          await this.citasService.confirmarCita(citaMall.citaId);
        }
      }

      // Transformar a formato de respuesta del mall
      return this.transformarVentaARespuestaMall(ventaCompleta, registroDto);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (citaMall && citaMallEsNueva) {
        await this.citasService.cancelarCita(citaMall.citaId, 'Venta no completada');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crea una venta usando IDs internos (flujo local)
   */
  async createVenta(createVentaDto: CreateVentaDto): Promise<Venta> {
    let { orderCode, clienteId, sucursalId, estadoVentaId, ventaLineas } = createVentaDto;

    orderCode = await this.obtenerOrderCodeValido(orderCode);

    // Validar cliente (opcional)
    if (clienteId) {
      const cliente = await this.clienteRepository.findOne({ where: { clienteId } });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
      }
    }

    // Validar sucursal
    const sucursal = await this.sucursalRepository.findOne({ where: { sucursalId } });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${sucursalId} no encontrada`);
    }

    // Validar estado de venta
    const estadoVenta = await this.estadoVentaRepository.findOne({ where: { estadoVentaId } });
    if (!estadoVenta) {
      throw new NotFoundException(`Estado de venta con ID ${estadoVentaId} no encontrado`);
    }

    if (!ventaLineas || ventaLineas.length === 0) {
      throw new BadRequestException('La venta debe contener al menos una línea');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const citasAConfirmar: number[] = [];

    try {
      let totalBruto = createVentaDto.totalBruto ?? 0;
      let descuentoTotal = createVentaDto.descuentoTotal ?? 0;
      let totalNeto = createVentaDto.totalNeto ?? 0;

      const lineasPreparadas: Partial<VentaLinea>[] = [];

      for (const linea of ventaLineas) {
        if (linea.tipoItem === 'SERVICIO') {
          if (!linea.servicioId) {
            throw new BadRequestException('servicioId es obligatorio cuando tipoItem es SERVICIO');
          }
          const servicio = await this.servicioRepository.findOne({
            where: { servicioId: linea.servicioId },
          });
          if (!servicio) {
            throw new NotFoundException(`Servicio con ID ${linea.servicioId} no encontrado`);
          }
          let appointmentLinea = linea.appointmentTime ? new Date(linea.appointmentTime) : undefined;
          let citaRelacionada: Cita | null = null;
          if (linea.citaId) {
            citaRelacionada = await this.citaRepository.findOne({
              where: { citaId: linea.citaId },
            });
            if (!citaRelacionada) {
              throw new NotFoundException(`Cita con ID ${linea.citaId} no encontrada`);
            }
            if (citaRelacionada.sucursalId && citaRelacionada.sucursalId !== sucursalId) {
              throw new BadRequestException('La cita no pertenece a la sucursal de la venta');
            }
            appointmentLinea = citaRelacionada.fechaInicio;
            citasAConfirmar.push(citaRelacionada.citaId);
          }
          lineasPreparadas.push({
            tipoItem: 'SERVICIO',
            servicioId: servicio.servicioId,
            quantity: linea.quantity || 1,
            priceUnit: linea.priceUnit,
            discountAmount: linea.discountAmount || 0,
            priceTotal: (linea.priceUnit - (linea.discountAmount || 0)) * (linea.quantity || 1),
            serviceExternalId: linea.serviceExternalId,
            appointmentTime: appointmentLinea,
            citaId: citaRelacionada?.citaId,
          });
        } else {
          if (!linea.productoId) {
            throw new BadRequestException('productoId es obligatorio cuando tipoItem es PRODUCTO');
          }
          const producto = await this.productoRepository.findOne({
            where: { productoId: linea.productoId },
          });
          if (!producto) {
            throw new NotFoundException(`Producto con ID ${linea.productoId} no encontrado`);
          }
          lineasPreparadas.push({
            tipoItem: 'PRODUCTO',
            productoId: producto.productoId,
            quantity: linea.quantity || 1,
            priceUnit: linea.priceUnit,
            discountAmount: linea.discountAmount || 0,
            priceTotal: (linea.priceUnit - (linea.discountAmount || 0)) * (linea.quantity || 1),
            productExternalId: linea.productExternalId,
            size: linea.size,
            color: linea.color,
            options: linea.options,
          });
        }

        totalBruto += (linea.priceUnit || 0) * (linea.quantity || 1);
        descuentoTotal += linea.discountAmount || 0;
      }

      totalNeto = totalBruto - descuentoTotal;

      const venta = queryRunner.manager.create(Venta, {
        orderCode,
        clienteId,
        sucursalId,
        estadoVentaId,
        totalBruto,
        descuentoTotal,
        totalNeto,
        origen: createVentaDto.origen || 'LOCAL',
        comentarios: createVentaDto.comentarios,
      });

      const ventaGuardada = await queryRunner.manager.save(venta);

      for (const linea of lineasPreparadas) {
        const ventaLinea = queryRunner.manager.create(VentaLinea, {
          ...linea,
          ventaId: ventaGuardada.ventaId,
        });
        await queryRunner.manager.save(ventaLinea);
      }

      await queryRunner.commitTransaction();

      if (citasAConfirmar.length > 0) {
        for (const citaId of citasAConfirmar) {
          await this.citasService.confirmarCita(citaId);
        }
      }

      const ventaCompleta = await this.ventaRepository.findOne({
        where: { ventaId: ventaGuardada.ventaId },
        relations: [
          'cliente',
          'sucursal',
          'estadoVenta',
          'ventaLineas',
          'ventaLineas.servicio',
          'ventaLineas.producto',
          'ventaLineas.cita',
        ],
      });

      return this.limpiarRespuestaVenta(ventaCompleta);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Limpia la respuesta de venta excluyendo campos no deseados
   * Excluye: size, color, options de ventaLineas y talla, color, stock del servicio
   */
  private limpiarRespuestaVenta(venta: Venta): Venta {
    if (!venta) return venta;

    // Convertir a objeto plano y eliminar campos no deseados
    const ventaLimpia = JSON.parse(JSON.stringify(venta));

    // Limpiar ventaLineas
    if (ventaLimpia.ventaLineas && ventaLimpia.ventaLineas.length > 0) {
      ventaLimpia.ventaLineas = ventaLimpia.ventaLineas.map((linea: any) => {
        // Eliminar campos no deseados de la línea
        delete linea.size;
        delete linea.color;
        delete linea.options;
        
        // Limpiar servicio si existe
        if (linea.servicio) {
          delete linea.servicio.talla;
          delete linea.servicio.color;
          delete linea.servicio.stock;
        }

        // Limpiar producto si existe (también puede tener talla, color)
        if (linea.producto) {
          delete linea.producto.talla;
          delete linea.producto.color;
        }

        return linea;
      });
    }

    if (ventaLimpia.transacciones && ventaLimpia.transacciones.length > 0) {
      ventaLimpia.transacciones = ventaLimpia.transacciones.map((transaccion: any) => {
        delete transaccion.tokenTarjeta;
        delete transaccion.cvvHash;
        delete transaccion.ctaOrigen;
        delete transaccion.ctaDestino;
        delete transaccion.bancoPayload;
        return transaccion;
      });
    }

    return ventaLimpia as Venta;
  }

  private async asegurarCitaParaVentaMall(params: {
    servicio: Servicio;
    sucursalId: number;
    clienteId: number;
    appointmentTime?: Date;
  }): Promise<{ cita: Cita; esNueva: boolean } | null> {
    const { servicio, sucursalId, clienteId, appointmentTime } = params;
    if (!appointmentTime) {
      return null;
    }

    const fechaInicio = new Date(appointmentTime);
    if (Number.isNaN(fechaInicio.getTime())) {
      return null;
    }

    const duracion = servicio.duracionMinutos || 30;
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + duracion);

    const ventanaBusquedaMs = 5 * 60 * 1000;
    const citaExistente = await this.citaRepository.findOne({
      where: {
        sucursalId,
        servicioId: servicio.servicioId,
        clienteId,
        fechaInicio: Between(
          new Date(fechaInicio.getTime() - ventanaBusquedaMs),
          new Date(fechaInicio.getTime() + ventanaBusquedaMs),
        ),
      },
      relations: ['estadoCita'],
    });

    if (citaExistente) {
      await this.asignarBarberoSiNecesario(citaExistente, sucursalId, fechaInicio, fechaFin);

      const estado = citaExistente.estadoCita?.codigo?.toUpperCase();
      if (estado !== 'CANCELADA') {
        return { cita: citaExistente, esNueva: false };
      }
    }

    const estadoReservadaId = await this.citasService.getEstadoCitaIdByCodigo('RESERVADA');
    const barberoDisponible = await this.citasService.encontrarBarberoDisponible(
      sucursalId,
      fechaInicio,
      fechaFin,
    );

    if (!barberoDisponible) {
      throw new BadRequestException('No hay barberos disponibles para el horario solicitado');
    }

    const citaNueva = this.citaRepository.create({
      servicioId: servicio.servicioId,
      sucursalId,
      clienteId,
      fechaInicio,
      fechaFin,
      estadoCitaId: estadoReservadaId,
      origen: 'MALL',
      barberoId: barberoDisponible.barberoId,
    });

    const citaGuardada = await this.citaRepository.save(citaNueva);
    return { cita: citaGuardada, esNueva: true };
  }
  private async asignarBarberoSiNecesario(
    cita: Cita,
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<void> {
    const barberoActualId = cita.barberoId;
    let necesitaNuevoBarbero = false;

    if (!barberoActualId) {
      necesitaNuevoBarbero = true;
    } else {
      const horarioValido = await this.citasService.barberoTieneHorarioParaSlot(
        sucursalId,
        barberoActualId,
        fechaInicio,
        fechaFin,
      );

      if (!horarioValido) {
        necesitaNuevoBarbero = true;
      } else {
        const barbero = await this.barberoRepository.findOne({
          where: { barberoId: barberoActualId },
        });
        if (!barbero || barbero.sucursalId !== sucursalId || !barbero.activo) {
          necesitaNuevoBarbero = true;
        } else {
          const disponible = await this.citasService.barberoSlotLibre(
            sucursalId,
            barbero.barberoId,
            fechaInicio,
            fechaFin,
          );
          if (!disponible) {
            necesitaNuevoBarbero = true;
          }
        }
      }
    }

    if (!necesitaNuevoBarbero) {
      return;
    }

    const barberoAsignado = await this.citasService.encontrarBarberoDisponible(
      sucursalId,
      fechaInicio,
      fechaFin,
    );
    if (!barberoAsignado) {
      throw new BadRequestException('No hay barberos disponibles para el horario solicitado');
    }

    await this.citaRepository.update(cita.citaId, {
      barberoId: barberoAsignado.barberoId,
    });
    cita.barberoId = barberoAsignado.barberoId;
  }

  private async obtenerOrderCodeValido(orderCode?: string): Promise<string> {
    let codigo = orderCode;
    let intentos = 0;

    while (!codigo || !codigo.trim()) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      codigo = `ORD-${timestamp}-${random}`;
      intentos++;
      if (intentos > 10) {
        throw new BadRequestException('No fue posible generar un orderCode válido');
      }
    }

    let existe = await this.ventaRepository.findOne({ where: { orderCode: codigo } });
    let reintentos = 0;

    while (existe) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      codigo = `ORD-${timestamp}-${random}`;
      existe = await this.ventaRepository.findOne({ where: { orderCode: codigo } });
      reintentos++;
      if (reintentos > 10) {
        throw new BadRequestException('No fue posible generar un orderCode único');
      }
    }

    return codigo;
  }

  /**
   * Transforma una venta a formato de respuesta esperado por el mall
   * Formato similar al SPA pero adaptado para barbería
   */
  private transformarVentaARespuestaMall(
    venta: Venta,
    registroDto?: CreateRegistroVentaServicioDto,
  ): RegistroVentaServicioResponseDto {
    // Obtener la primera línea de venta (servicio)
    const ventaLinea = venta.ventaLineas?.[0];
    if (!ventaLinea) {
      throw new BadRequestException('La venta no tiene líneas asociadas');
    }

    const servicio = ventaLinea.servicio;
    if (!servicio) {
      throw new BadRequestException('La línea de venta no tiene servicio asociado');
    }

    // Obtener el estatus de la venta desde catestadoventa
    const estatusVenta = venta.estadoVenta?.codigo || 'PENDIENTE';
    
    // Si la venta está cancelada, el estatus de la cita también debe ser CANCELADA
    // Si no está cancelada, obtener el estado de la cita asociada
    let estatusCita: string;
    if (estatusVenta === 'CANCELADA') {
      estatusCita = 'CANCELADA';
    } else {
      const cita = ventaLinea.cita;
      estatusCita = cita?.estadoCita?.codigo || 'RESERVADA';
    }

    // Determinar el mensaje según el estado
    const message = estatusVenta === 'CANCELADA' 
      ? 'Cita cancelada en Barbería'
      : 'Cita registrada correctamente en Barbería';

    // Formatear fecha y hora de la cita
    let fechaReserva = '';
    let horaReserva = '';
    
    if (ventaLinea.appointmentTime) {
      const appointmentDateObj = new Date(ventaLinea.appointmentTime);
      // Formato fecha: YYYY-MM-DD
      fechaReserva = appointmentDateObj.toISOString().split('T')[0];
      // Formato hora: HH:mm:ss
      const horas = String(appointmentDateObj.getHours()).padStart(2, '0');
      const minutos = String(appointmentDateObj.getMinutes()).padStart(2, '0');
      const segundos = String(appointmentDateObj.getSeconds()).padStart(2, '0');
      horaReserva = `${horas}:${minutos}:${segundos}`;
    }

    // Generar código de reserva: BAR-YYYYMMDD-{ventaId}
    const fechaSinGuiones = fechaReserva 
      ? fechaReserva.replace(/-/g, '') 
      : new Date().toISOString().split('T')[0].replace(/-/g, '');
    const codigoReserva = `BAR-${fechaSinGuiones}-${venta.ventaId}`;

    // Obtener duration_minutes
    const durationMinutes = registroDto?.duration_minutes || servicio.duracionMinutos || 0;

    // Usar el order_code de la venta como mall_order_id
    const mallOrderId = venta.orderCode;

    return {
      message: message,
      venta_id_barberia: venta.ventaId,
      codigo_reserva: codigoReserva,
      mall_order_id: mallOrderId,
      estatus_cita: estatusCita,
      fecha_cita: fechaReserva || undefined,
      hora_cita: horaReserva || undefined,
      duracion_minutos: durationMinutes,
    };
  }

  private async getEstadoVentaIdByCodigo(codigo: string): Promise<number> {
    const estado = await this.estadoVentaRepository.findOne({
      where: { codigo },
    });

    if (!estado) {
      throw new BadRequestException(`No existe un estado de venta con código ${codigo}`);
    }

    return estado.estadoVentaId;
  }

  async cancelarVenta(id: number, cancelarDto: CancelarVentaDto): Promise<Venta> {
    const venta = await this.findVentaById(id);
    const estadoCanceladaId = await this.getEstadoVentaIdByCodigo('CANCELADA');

    await this.ventaRepository.update(id, {
      estadoVentaId: estadoCanceladaId,
      comentarios: cancelarDto.motivo || venta.comentarios,
    });

    if (venta.ventaLineas?.length) {
      for (const linea of venta.ventaLineas) {
        if (linea.citaId) {
          await this.citasService.cancelarCita(
            linea.citaId,
            cancelarDto.motivo || 'Venta cancelada',
          );
        }
      }
    }

    return this.findVentaById(id);
  }
}

