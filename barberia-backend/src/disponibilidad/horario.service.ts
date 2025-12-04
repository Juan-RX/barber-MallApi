import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { HorarioSucursal } from '../entities/horario-sucursal.entity';
import { HorarioBarbero } from '../entities/horario-barbero.entity';
import { ExcepcionHorario, TipoExcepcion } from '../entities/excepcion-horario.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { Barbero } from '../entities/barbero.entity';
import { PausaBarbero } from '../entities/pausa-barbero.entity';
import { CreateHorarioSucursalDto } from './dto/create-horario-sucursal.dto';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
import { CreateExcepcionHorarioDto } from './dto/create-excepcion-horario.dto';
import { CreatePausaBarberoDto } from './dto/create-pausa-barbero.dto';

export interface HorarioDisponible {
  horaInicio: number; // Hora en formato 24h (0-23)
  minutoInicio: number; // Minuto (0-59)
  horaFin: number;
  minutoFin: number;
  disponible: boolean;
}

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(HorarioSucursal)
    private horarioSucursalRepository: Repository<HorarioSucursal>,
    @InjectRepository(HorarioBarbero)
    private horarioBarberoRepository: Repository<HorarioBarbero>,
    @InjectRepository(ExcepcionHorario)
    private excepcionRepository: Repository<ExcepcionHorario>,
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
    @InjectRepository(Barbero)
    private barberoRepository: Repository<Barbero>,
    @InjectRepository(PausaBarbero)
    private pausaBarberoRepository: Repository<PausaBarbero>,
  ) {}

  /**
   * Valida que las horas de apertura y cierre sean válidas
   */
  private validarRangoHoras(horaInicio: string, horaFin: string, campoInicio: string, campoFin: string): void {
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const [horaF, minF] = horaFin.split(':').map(Number);

    const minutosInicio = horaI * 60 + minI;
    const minutosFin = horaF * 60 + minF;

    if (minutosFin <= minutosInicio) {
      throw new BadRequestException(
        `La ${campoFin} (${horaFin}) debe ser posterior a la ${campoInicio} (${horaInicio})`,
      );
    }
  }

  /**
   * Obtiene el horario de una sucursal para un día específico
   */
  async getHorarioSucursal(sucursalId: number, fecha: Date): Promise<HorarioDisponible | null> {
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay(); // Convertir domingo de 0 a 7
    const fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const fechaFin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);

    // Verificar si hay excepción de sucursal cerrada
    const excepcionesCerradas = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.SUCURSAL_CERRADA,
        sucursalId,
        activo: true,
      },
    });

    // Verificar si la fecha está dentro del rango de alguna excepción
    const excepcionCerrada = excepcionesCerradas.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin
        ? new Date(exc.fechaFin)
        : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (excepcionCerrada) {
      return null; // Sucursal cerrada
    }

    // Verificar si hay horario especial
    const horariosEspeciales = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.HORARIO_ESPECIAL_SUCURSAL,
        sucursalId,
        activo: true,
      },
    });

    const horarioEspecial = horariosEspeciales.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin
        ? new Date(exc.fechaFin)
        : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (horarioEspecial && horarioEspecial.horaInicio && horarioEspecial.horaFin) {
      const [horaInicio, minutoInicio] = horarioEspecial.horaInicio.split(':').map(Number);
      const [horaFin, minutoFin] = horarioEspecial.horaFin.split(':').map(Number);
      return {
        horaInicio,
        minutoInicio,
        horaFin,
        minutoFin,
        disponible: true,
      };
    }

    // Obtener horario regular (horarios base son permanentes, no tienen vigencia)
    const horario = await this.horarioSucursalRepository.findOne({
      where: {
        sucursalId,
        diaSemana,
        activo: true,
      },
    });

    if (!horario || horario.esCerrado) {
      return null;
    }

    const [horaInicio, minutoInicio] = horario.horaApertura.split(':').map(Number);
    const [horaFin, minutoFin] = horario.horaCierre.split(':').map(Number);

    return {
      horaInicio,
      minutoInicio,
      horaFin,
      minutoFin,
      disponible: true,
    };
  }

  /**
   * Obtiene el horario de un barbero para un día específico
   */
  async getHorarioBarbero(barberoId: number, fecha: Date): Promise<HorarioDisponible | null> {
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
    const fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const fechaFin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);

    // Verificar si hay excepción de barbero ausente
    const excepcionesAusentes = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.BARBERO_AUSENTE,
        barberoId,
        activo: true,
      },
    });

    // Verificar si la fecha está dentro del rango de alguna excepción
    const excepcionAusente = excepcionesAusentes.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin
        ? new Date(exc.fechaFin)
        : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (excepcionAusente) {
      return null; // Barbero ausente
    }

    // Verificar si hay horario especial
    const horariosEspeciales = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.HORARIO_ESPECIAL_BARBERO,
        barberoId,
        activo: true,
      },
    });

    const horarioEspecial = horariosEspeciales.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin
        ? new Date(exc.fechaFin)
        : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (horarioEspecial && horarioEspecial.horaInicio && horarioEspecial.horaFin) {
      const [horaInicio, minutoInicio] = horarioEspecial.horaInicio.split(':').map(Number);
      const [horaFin, minutoFin] = horarioEspecial.horaFin.split(':').map(Number);
      return {
        horaInicio,
        minutoInicio,
        horaFin,
        minutoFin,
        disponible: true,
      };
    }

    // Obtener horario regular (horarios base son permanentes, no tienen vigencia)
    const horario = await this.horarioBarberoRepository.findOne({
      where: {
        barberoId,
        diaSemana,
        activo: true,
      },
    });

    if (!horario) {
      return null;
    }

    const [horaInicio, minutoInicio] = horario.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = horario.horaFin.split(':').map(Number);

    return {
      horaInicio,
      minutoInicio,
      horaFin,
      minutoFin,
      disponible: true,
    };
  }

  /**
   * Obtiene las pausas de un barbero para un día específico (método privado que usa fecha)
   */
  private async getPausasBarberoPorFecha(barberoId: number, fecha: Date): Promise<PausaBarbero[]> {
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
    return await this.pausaBarberoRepository.find({
      where: {
        barberoId,
        diaSemana,
        activo: true,
      },
      order: { horaInicio: 'ASC' },
    });
  }

  /**
   * Verifica si un slot de tiempo se solapa con alguna pausa
   */
  private isSlotEnPausa(
    horaInicio: number,
    minutoInicio: number,
    horaFin: number,
    minutoFin: number,
    pausas: PausaBarbero[],
  ): boolean {
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = horaFin * 60 + minutoFin;

    for (const pausa of pausas) {
      const [pausaHoraInicio, pausaMinutoInicio] = pausa.horaInicio.split(':').map(Number);
      const [pausaHoraFin, pausaMinutoFin] = pausa.horaFin.split(':').map(Number);

      const pausaMinutosInicio = pausaHoraInicio * 60 + pausaMinutoInicio;
      const pausaMinutosFin = pausaHoraFin * 60 + pausaMinutoFin;

      // Verificar solapamiento
      if (
        (minutosInicio >= pausaMinutosInicio && minutosInicio < pausaMinutosFin) ||
        (minutosFin > pausaMinutosInicio && minutosFin <= pausaMinutosFin) ||
        (minutosInicio <= pausaMinutosInicio && minutosFin >= pausaMinutosFin)
      ) {
        return true; // El slot se solapa con una pausa
      }
    }

    return false;
  }

  /**
   * Calcula la intersección de horarios entre sucursal y barbero, excluyendo pausas
   */
  async calcularHorarioDisponible(
    sucursalId: number,
    barberoId: number,
    fecha: Date,
  ): Promise<HorarioDisponible | null> {
    const horarioSucursal = await this.getHorarioSucursal(sucursalId, fecha);
    const horarioBarbero = await this.getHorarioBarbero(barberoId, fecha);

    if (!horarioSucursal || !horarioBarbero) {
      return null;
    }

    // Calcular intersección
    const inicioSucursal = horarioSucursal.horaInicio * 60 + horarioSucursal.minutoInicio;
    const finSucursal = horarioSucursal.horaFin * 60 + horarioSucursal.minutoFin;
    const inicioBarbero = horarioBarbero.horaInicio * 60 + horarioBarbero.minutoInicio;
    const finBarbero = horarioBarbero.horaFin * 60 + horarioBarbero.minutoFin;

    const inicioInterseccion = Math.max(inicioSucursal, inicioBarbero);
    const finInterseccion = Math.min(finSucursal, finBarbero);

    if (inicioInterseccion >= finInterseccion) {
      return null; // No hay intersección
    }

    // Obtener pausas del barbero para este día
    const pausas = await this.getPausasBarberoPorFecha(barberoId, fecha);

    // Si hay pausas, verificar que el horario disponible no esté completamente en una pausa
    // (Nota: El filtrado completo de slots por pausas se hace en DisponibilidadService)
    // Aquí solo retornamos el horario base sin considerar pausas detalladas

    return {
      horaInicio: Math.floor(inicioInterseccion / 60),
      minutoInicio: inicioInterseccion % 60,
      horaFin: Math.floor(finInterseccion / 60),
      minutoFin: finInterseccion % 60,
      disponible: true,
    };
  }

  /**
   * Obtiene las pausas de un barbero para un día específico (método público que usa fecha)
   */
  async obtenerPausasBarbero(barberoId: number, fecha: Date): Promise<PausaBarbero[]> {
    return this.getPausasBarberoPorFecha(barberoId, fecha);
  }

  /**
   * Verifica si un slot se solapa con alguna pausa (método público)
   */
  verificarSlotEnPausa(
    horaInicio: number,
    minutoInicio: number,
    horaFin: number,
    minutoFin: number,
    pausas: PausaBarbero[],
  ): boolean {
    return this.isSlotEnPausa(horaInicio, minutoInicio, horaFin, minutoFin, pausas);
  }

  // ========== CRUD HORARIOS SUCURSAL ==========

  async createHorarioSucursal(createDto: CreateHorarioSucursalDto): Promise<HorarioSucursal> {
    // Validar que la sucursal existe
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalId: createDto.sucursalId },
    });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${createDto.sucursalId} no encontrada`);
    }

    // Validar rango de horas
    if (!createDto.esCerrado) {
      this.validarRangoHoras(createDto.horaApertura, createDto.horaCierre, 'hora de apertura', 'hora de cierre');
    }

    // Validar que no exista un horario duplicado para la misma sucursal y día
    const horarioExistente = await this.horarioSucursalRepository.findOne({
      where: {
        sucursalId: createDto.sucursalId,
        diaSemana: createDto.diaSemana,
        activo: true,
      },
    });
    if (horarioExistente) {
      throw new BadRequestException(
        `Ya existe un horario activo para la sucursal ${createDto.sucursalId} en el día ${createDto.diaSemana}`,
      );
    }

    // Convertir fechas de string a Date si se proporcionan
    // Parsear manualmente para evitar problemas de zona horaria
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    if (createDto.fechaInicio) {
      // Si viene como YYYY-MM-DD, parsear manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(createDto.fechaInicio.trim())) {
        const [year, month, day] = createDto.fechaInicio.trim().split('-').map(Number);
        fechaInicio = new Date(year, month - 1, day); // month es 0-indexed, fecha local
      } else {
        fechaInicio = new Date(createDto.fechaInicio);
      }
    }

    if (createDto.fechaFin) {
      // Si viene como YYYY-MM-DD, parsear manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(createDto.fechaFin.trim())) {
        const [year, month, day] = createDto.fechaFin.trim().split('-').map(Number);
        fechaFin = new Date(year, month - 1, day); // month es 0-indexed, fecha local
      } else {
        fechaFin = new Date(createDto.fechaFin);
      }
    }

    const horario = this.horarioSucursalRepository.create({
      ...createDto,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    });
    return await this.horarioSucursalRepository.save(horario);
  }

  async getHorariosSucursal(sucursalId: number): Promise<HorarioSucursal[]> {
    // Validar que la sucursal existe
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalId },
    });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${sucursalId} no encontrada`);
    }

    return await this.horarioSucursalRepository.find({
      where: { sucursalId, activo: true },
      order: { diaSemana: 'ASC' },
      relations: ['sucursal'],
    });
  }

  async getHorarioSucursalPorDia(sucursalId: number, fecha: string): Promise<HorarioSucursal | null> {
    // Validar que la sucursal existe
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalId },
    });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${sucursalId} no encontrada`);
    }

    // Validar formato de fecha y parsear correctamente
    if (!fecha || fecha.trim() === '') {
      throw new BadRequestException('La fecha es requerida');
    }

    // Parsear fecha considerando zona horaria local para evitar problemas con UTC
    let fechaDate: Date;
    try {
      // Si la fecha viene como YYYY-MM-DD, parsearla manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
        const [year, month, day] = fecha.trim().split('-').map(Number);
        fechaDate = new Date(year, month - 1, day); // month es 0-indexed
      } else {
        // Intentar parsear como ISO string u otro formato
        fechaDate = new Date(fecha);
      }

      if (isNaN(fechaDate.getTime())) {
        throw new BadRequestException(`Fecha inválida: ${fecha}. Use formato YYYY-MM-DD (ej: 2024-01-15)`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Fecha inválida: ${fecha}. Use formato YYYY-MM-DD (ej: 2024-01-15)`);
    }

    // Calcular día de la semana (1=Lunes, 7=Domingo)
    const diaSemana = fechaDate.getDay() === 0 ? 7 : fechaDate.getDay();

    // Obtener horario regular de la base de datos
    const horarioRegistro = await this.horarioSucursalRepository.findOne({
      where: { sucursalId, diaSemana, activo: true },
      relations: ['sucursal'],
    });

    // Si no hay horario regular, verificar si hay excepciones o horarios especiales
    if (!horarioRegistro) {
      // Verificar si hay excepción de sucursal cerrada
      const excepcionesCerradas = await this.excepcionRepository.find({
        where: {
          tipo: TipoExcepcion.SUCURSAL_CERRADA,
          sucursalId,
          activo: true,
        },
      });

      const fechaInicio = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
      const excepcionCerrada = excepcionesCerradas.find((exc) => {
        const excInicio = new Date(exc.fechaInicio);
        excInicio.setHours(0, 0, 0, 0);
        const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
        excFin.setHours(23, 59, 59, 999);
        return fechaInicio >= excInicio && fechaInicio <= excFin;
      });

      if (excepcionCerrada) {
        return null; // Sucursal cerrada
      }

      // Si no hay horario regular ni excepciones, retornar null
      return null;
    }

    // Verificar si hay excepción de sucursal cerrada (sobrescribe el horario regular)
    const excepcionesCerradas = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.SUCURSAL_CERRADA,
        sucursalId,
        activo: true,
      },
    });

    const fechaInicio = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
    const excepcionCerrada = excepcionesCerradas.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (excepcionCerrada) {
      return null; // Sucursal cerrada aunque tenga horario regular
    }

    // Verificar si hay horario especial (sobrescribe el horario regular)
    const horariosEspeciales = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.HORARIO_ESPECIAL_SUCURSAL,
        sucursalId,
        activo: true,
      },
    });

    const horarioEspecial = horariosEspeciales.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    // Si hay horario especial, crear un objeto temporal con los horarios especiales
    if (horarioEspecial && horarioEspecial.horaInicio && horarioEspecial.horaFin) {
      // Retornar el horario regular pero con los horarios especiales aplicados
      return {
        ...horarioRegistro,
        horaApertura: horarioEspecial.horaInicio,
        horaCierre: horarioEspecial.horaFin,
      };
    }

    // Retornar horario regular
    return horarioRegistro;
  }

  async updateHorarioSucursal(
    id: number,
    updateDto: Partial<CreateHorarioSucursalDto>,
  ): Promise<HorarioSucursal> {
    const horario = await this.horarioSucursalRepository.findOne({ where: { horarioSucursalId: id } });
    if (!horario) {
      throw new NotFoundException(`Horario de sucursal con ID ${id} no encontrado`);
    }

    // Validar rango de horas si se actualizan
    if (updateDto.horaApertura && updateDto.horaCierre) {
      this.validarRangoHoras(updateDto.horaApertura, updateDto.horaCierre, 'hora de apertura', 'hora de cierre');
    } else if (updateDto.horaApertura) {
      const horaCierre = horario.horaCierre;
      this.validarRangoHoras(updateDto.horaApertura, horaCierre, 'hora de apertura', 'hora de cierre');
    } else if (updateDto.horaCierre) {
      const horaApertura = horario.horaApertura;
      this.validarRangoHoras(horaApertura, updateDto.horaCierre, 'hora de apertura', 'hora de cierre');
    }

    // Los campos fechaInicio y fechaFin se ignoran - los horarios base son permanentes

    // Actualizar sin fechas (se ignoran si vienen en updateDto)
    const { fechaInicio, fechaFin, ...updateData } = updateDto;
    await this.horarioSucursalRepository.update(id, updateData);
    const horarioActualizado = await this.horarioSucursalRepository.findOne({
      where: { horarioSucursalId: id },
      relations: ['sucursal'],
    });
    if (!horarioActualizado) {
      throw new NotFoundException(`Error al actualizar horario de sucursal con ID ${id}`);
    }
    return horarioActualizado;
  }

  async deleteHorarioSucursal(id: number): Promise<void> {
    const horario = await this.horarioSucursalRepository.findOne({ where: { horarioSucursalId: id } });
    if (!horario) {
      throw new NotFoundException(`Horario de sucursal con ID ${id} no encontrado`);
    }
    await this.horarioSucursalRepository.delete(id);
  }

  // ========== CRUD HORARIOS BARBERO ==========

  async createHorarioBarbero(createDto: CreateHorarioBarberoDto): Promise<HorarioBarbero> {
    // Validar que el barbero existe
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId: createDto.barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${createDto.barberoId} no encontrado`);
    }

    // Validar rango de horas
    this.validarRangoHoras(createDto.horaInicio, createDto.horaFin, 'hora de inicio', 'hora de fin');

    // Validar que no exista un horario duplicado para el mismo barbero y día
    const horarioExistente = await this.horarioBarberoRepository.findOne({
      where: {
        barberoId: createDto.barberoId,
        diaSemana: createDto.diaSemana,
        activo: true,
      },
    });
    if (horarioExistente) {
      throw new BadRequestException(
        `Ya existe un horario activo para el barbero ${createDto.barberoId} en el día ${createDto.diaSemana}`,
      );
    }

    // Convertir fechas de string a Date si se proporcionan
    // Parsear manualmente para evitar problemas de zona horaria
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    if (createDto.fechaInicio) {
      // Si viene como YYYY-MM-DD, parsear manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(createDto.fechaInicio.trim())) {
        const [year, month, day] = createDto.fechaInicio.trim().split('-').map(Number);
        fechaInicio = new Date(year, month - 1, day); // month es 0-indexed, fecha local
      } else {
        fechaInicio = new Date(createDto.fechaInicio);
      }
    }

    if (createDto.fechaFin) {
      // Si viene como YYYY-MM-DD, parsear manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(createDto.fechaFin.trim())) {
        const [year, month, day] = createDto.fechaFin.trim().split('-').map(Number);
        fechaFin = new Date(year, month - 1, day); // month es 0-indexed, fecha local
      } else {
        fechaFin = new Date(createDto.fechaFin);
      }
    }

    const horario = this.horarioBarberoRepository.create({
      ...createDto,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    });
    return await this.horarioBarberoRepository.save(horario);
  }

  async getHorariosBarbero(barberoId: number): Promise<HorarioBarbero[]> {
    // Validar que el barbero existe
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${barberoId} no encontrado`);
    }

    return await this.horarioBarberoRepository.find({
      where: { barberoId, activo: true },
      order: { diaSemana: 'ASC' },
      relations: ['barbero'],
    });
  }

  async getHorarioBarberoPorDia(barberoId: number, fecha: string): Promise<HorarioBarbero | null> {
    // Validar que el barbero existe
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${barberoId} no encontrado`);
    }

    // Validar formato de fecha y parsear correctamente
    if (!fecha || fecha.trim() === '') {
      throw new BadRequestException('La fecha es requerida');
    }

    // Parsear fecha considerando zona horaria local para evitar problemas con UTC
    let fechaDate: Date;
    try {
      // Si la fecha viene como YYYY-MM-DD, parsearla manualmente para evitar problemas de UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
        const [year, month, day] = fecha.trim().split('-').map(Number);
        fechaDate = new Date(year, month - 1, day); // month es 0-indexed
      } else {
        // Intentar parsear como ISO string u otro formato
        fechaDate = new Date(fecha);
      }

      if (isNaN(fechaDate.getTime())) {
        throw new BadRequestException(`Fecha inválida: ${fecha}. Use formato YYYY-MM-DD (ej: 2024-01-15)`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Fecha inválida: ${fecha}. Use formato YYYY-MM-DD (ej: 2024-01-15)`);
    }

    // Calcular día de la semana (1=Lunes, 7=Domingo)
    const diaSemana = fechaDate.getDay() === 0 ? 7 : fechaDate.getDay();

    // Obtener horario regular de la base de datos
    const horarioRegistro = await this.horarioBarberoRepository.findOne({
      where: { barberoId, diaSemana, activo: true },
      relations: ['barbero'],
    });

    // Si no hay horario regular, verificar si hay excepciones
    if (!horarioRegistro) {
      // Verificar si hay excepción de barbero ausente
      const excepcionesAusentes = await this.excepcionRepository.find({
        where: {
          tipo: TipoExcepcion.BARBERO_AUSENTE,
          barberoId,
          activo: true,
        },
      });

      const fechaInicio = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
      const excepcionAusente = excepcionesAusentes.find((exc) => {
        const excInicio = new Date(exc.fechaInicio);
        excInicio.setHours(0, 0, 0, 0);
        const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
        excFin.setHours(23, 59, 59, 999);
        return fechaInicio >= excInicio && fechaInicio <= excFin;
      });

      if (excepcionAusente) {
        return null; // Barbero ausente
      }

      // Si no hay horario regular ni excepciones, retornar null
      return null;
    }

    // Verificar si hay excepción de barbero ausente (sobrescribe el horario regular)
    const excepcionesAusentes = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.BARBERO_AUSENTE,
        barberoId,
        activo: true,
      },
    });

    const fechaInicio = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
    const excepcionAusente = excepcionesAusentes.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    if (excepcionAusente) {
      return null; // Barbero ausente aunque tenga horario regular
    }

    // Verificar si hay horario especial (sobrescribe el horario regular)
    const horariosEspeciales = await this.excepcionRepository.find({
      where: {
        tipo: TipoExcepcion.HORARIO_ESPECIAL_BARBERO,
        barberoId,
        activo: true,
      },
    });

    const horarioEspecial = horariosEspeciales.find((exc) => {
      const excInicio = new Date(exc.fechaInicio);
      excInicio.setHours(0, 0, 0, 0);
      const excFin = exc.fechaFin ? new Date(exc.fechaFin) : new Date(exc.fechaInicio);
      excFin.setHours(23, 59, 59, 999);
      return fechaInicio >= excInicio && fechaInicio <= excFin;
    });

    // Si hay horario especial, crear un objeto temporal con los horarios especiales
    if (horarioEspecial && horarioEspecial.horaInicio && horarioEspecial.horaFin) {
      // Retornar el horario regular pero con los horarios especiales aplicados
      return {
        ...horarioRegistro,
        horaInicio: horarioEspecial.horaInicio,
        horaFin: horarioEspecial.horaFin,
      };
    }

    // Retornar horario regular
    return horarioRegistro;
  }

  async updateHorarioBarbero(
    id: number,
    updateDto: Partial<CreateHorarioBarberoDto>,
  ): Promise<HorarioBarbero> {
    const horario = await this.horarioBarberoRepository.findOne({ where: { horarioBarberoId: id } });
    if (!horario) {
      throw new NotFoundException(`Horario de barbero con ID ${id} no encontrado`);
    }

    // Validar rango de horas si se actualizan
    if (updateDto.horaInicio && updateDto.horaFin) {
      this.validarRangoHoras(updateDto.horaInicio, updateDto.horaFin, 'hora de inicio', 'hora de fin');
    } else if (updateDto.horaInicio) {
      const horaFin = horario.horaFin;
      this.validarRangoHoras(updateDto.horaInicio, horaFin, 'hora de inicio', 'hora de fin');
    } else if (updateDto.horaFin) {
      const horaInicio = horario.horaInicio;
      this.validarRangoHoras(horaInicio, updateDto.horaFin, 'hora de inicio', 'hora de fin');
    }

    // Los campos fechaInicio y fechaFin se ignoran - los horarios base son permanentes

    // Actualizar sin fechas (se ignoran si vienen en updateDto)
    const { fechaInicio, fechaFin, ...updateData } = updateDto;
    await this.horarioBarberoRepository.update(id, updateData);
    const horarioActualizado = await this.horarioBarberoRepository.findOne({
      where: { horarioBarberoId: id },
      relations: ['barbero'],
    });
    if (!horarioActualizado) {
      throw new NotFoundException(`Error al actualizar horario de barbero con ID ${id}`);
    }
    return horarioActualizado;
  }

  async deleteHorarioBarbero(id: number): Promise<void> {
    const horario = await this.horarioBarberoRepository.findOne({ where: { horarioBarberoId: id } });
    if (!horario) {
      throw new NotFoundException(`Horario de barbero con ID ${id} no encontrado`);
    }
    await this.horarioBarberoRepository.delete(id);
  }

  // ========== CRUD EXCEPCIONES ==========

  async createExcepcion(createDto: CreateExcepcionHorarioDto): Promise<ExcepcionHorario> {
    // Validar requerimientos según el tipo de excepción
    switch (createDto.tipo) {
      case TipoExcepcion.SUCURSAL_CERRADA:
        if (!createDto.sucursalId) {
          throw new BadRequestException('El campo sucursalId es requerido para excepciones de tipo SUCURSAL_CERRADA');
        }
        // Validar que la sucursal existe
        const sucursal = await this.sucursalRepository.findOne({
          where: { sucursalId: createDto.sucursalId },
        });
        if (!sucursal) {
          throw new NotFoundException(`Sucursal con ID ${createDto.sucursalId} no encontrada`);
        }
        break;

      case TipoExcepcion.BARBERO_AUSENTE:
        if (!createDto.barberoId) {
          throw new BadRequestException('El campo barberoId es requerido para excepciones de tipo BARBERO_AUSENTE');
        }
        // Validar que el barbero existe
        const barbero = await this.barberoRepository.findOne({
          where: { barberoId: createDto.barberoId },
        });
        if (!barbero) {
          throw new NotFoundException(`Barbero con ID ${createDto.barberoId} no encontrado`);
        }
        break;

      case TipoExcepcion.HORARIO_ESPECIAL_SUCURSAL:
        if (!createDto.sucursalId) {
          throw new BadRequestException(
            'El campo sucursalId es requerido para excepciones de tipo HORARIO_ESPECIAL_SUCURSAL',
          );
        }
        if (!createDto.horaInicio || !createDto.horaFin) {
          throw new BadRequestException(
            'Los campos horaInicio y horaFin son requeridos para excepciones de tipo HORARIO_ESPECIAL_SUCURSAL',
          );
        }
        // Validar que la sucursal existe
        const sucursalEspecial = await this.sucursalRepository.findOne({
          where: { sucursalId: createDto.sucursalId },
        });
        if (!sucursalEspecial) {
          throw new NotFoundException(`Sucursal con ID ${createDto.sucursalId} no encontrada`);
        }
        // Validar rango de horas
        this.validarRangoHoras(createDto.horaInicio, createDto.horaFin, 'hora de inicio', 'hora de fin');
        break;

      case TipoExcepcion.HORARIO_ESPECIAL_BARBERO:
        if (!createDto.barberoId) {
          throw new BadRequestException(
            'El campo barberoId es requerido para excepciones de tipo HORARIO_ESPECIAL_BARBERO',
          );
        }
        if (!createDto.horaInicio || !createDto.horaFin) {
          throw new BadRequestException(
            'Los campos horaInicio y horaFin son requeridos para excepciones de tipo HORARIO_ESPECIAL_BARBERO',
          );
        }
        // Validar que el barbero existe
        const barberoEspecial = await this.barberoRepository.findOne({
          where: { barberoId: createDto.barberoId },
        });
        if (!barberoEspecial) {
          throw new NotFoundException(`Barbero con ID ${createDto.barberoId} no encontrado`);
        }
        // Validar rango de horas
        this.validarRangoHoras(createDto.horaInicio, createDto.horaFin, 'hora de inicio', 'hora de fin');
        break;
    }

    // Validar fechas
    const fechaInicio = new Date(createDto.fechaInicio);
    let fechaFin: Date | undefined;
    if (createDto.fechaFin) {
      fechaFin = new Date(createDto.fechaFin);
      if (fechaFin < fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior o igual a la fecha de inicio');
      }
    }

    const excepcion = this.excepcionRepository.create({
      ...createDto,
      fechaInicio,
      fechaFin,
    });
    return await this.excepcionRepository.save(excepcion);
  }

  async getExcepciones(
    sucursalId?: number,
    barberoId?: number,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<ExcepcionHorario[]> {
    const where: any = { activo: true };

    if (sucursalId) where.sucursalId = sucursalId;
    if (barberoId) where.barberoId = barberoId;

    // Obtener todas las excepciones que cumplan los filtros básicos
    const excepciones = await this.excepcionRepository.find({
      where,
      relations: ['sucursal', 'barbero'],
      order: { fechaInicio: 'ASC' },
    });

    // Filtrar por rango de fechas si se proporciona (buscando solapamiento)
    if (fechaInicio) {
      const fechaInicioFiltro = new Date(fechaInicio);
      fechaInicioFiltro.setHours(0, 0, 0, 0);
      const fechaFinFiltro = fechaFin
        ? new Date(fechaFin)
        : new Date(fechaInicio);
      fechaFinFiltro.setHours(23, 59, 59, 999);

      return excepciones.filter((exc) => {
        const excInicio = new Date(exc.fechaInicio);
        excInicio.setHours(0, 0, 0, 0);
        const excFin = exc.fechaFin
          ? new Date(exc.fechaFin)
          : new Date(exc.fechaInicio);
        excFin.setHours(23, 59, 59, 999);

        // Verificar solapamiento de rangos
        return (
          (excInicio >= fechaInicioFiltro && excInicio <= fechaFinFiltro) || // Inicio dentro del rango
          (excFin >= fechaInicioFiltro && excFin <= fechaFinFiltro) || // Fin dentro del rango
          (excInicio <= fechaInicioFiltro && excFin >= fechaFinFiltro) // Rango contiene el filtro
        );
      });
    }

    return excepciones;
  }

  async updateExcepcion(
    id: number,
    updateDto: Partial<CreateExcepcionHorarioDto>,
  ): Promise<ExcepcionHorario> {
    const excepcion = await this.excepcionRepository.findOne({ where: { excepcionId: id } });
    if (!excepcion) {
      throw new NotFoundException(`Excepción con ID ${id} no encontrada`);
    }

    // Validar tipo de excepción si se actualiza
    const tipo = updateDto.tipo || excepcion.tipo;

    // Validar requerimientos según el tipo si se actualizan
    if (updateDto.tipo || updateDto.sucursalId !== undefined || updateDto.barberoId !== undefined) {
      const sucursalIdActualizar = updateDto.sucursalId !== undefined ? updateDto.sucursalId : excepcion.sucursalId;
      const barberoIdActualizar = updateDto.barberoId !== undefined ? updateDto.barberoId : excepcion.barberoId;

      switch (tipo) {
        case TipoExcepcion.SUCURSAL_CERRADA:
          if (!sucursalIdActualizar) {
            throw new BadRequestException('El campo sucursalId es requerido para excepciones de tipo SUCURSAL_CERRADA');
          }
          const sucursal = await this.sucursalRepository.findOne({
            where: { sucursalId: sucursalIdActualizar },
          });
          if (!sucursal) {
            throw new NotFoundException(`Sucursal con ID ${sucursalIdActualizar} no encontrada`);
          }
          break;

        case TipoExcepcion.BARBERO_AUSENTE:
          if (!barberoIdActualizar) {
            throw new BadRequestException('El campo barberoId es requerido para excepciones de tipo BARBERO_AUSENTE');
          }
          const barbero = await this.barberoRepository.findOne({
            where: { barberoId: barberoIdActualizar },
          });
          if (!barbero) {
            throw new NotFoundException(`Barbero con ID ${barberoIdActualizar} no encontrado`);
          }
          break;

        case TipoExcepcion.HORARIO_ESPECIAL_SUCURSAL:
          if (!sucursalIdActualizar) {
            throw new BadRequestException(
              'El campo sucursalId es requerido para excepciones de tipo HORARIO_ESPECIAL_SUCURSAL',
            );
          }
          const horaInicioEspecial = updateDto.horaInicio || excepcion.horaInicio;
          const horaFinEspecial = updateDto.horaFin || excepcion.horaFin;
          if (!horaInicioEspecial || !horaFinEspecial) {
            throw new BadRequestException(
              'Los campos horaInicio y horaFin son requeridos para excepciones de tipo HORARIO_ESPECIAL_SUCURSAL',
            );
          }
          const sucursalEspecial = await this.sucursalRepository.findOne({
            where: { sucursalId: sucursalIdActualizar },
          });
          if (!sucursalEspecial) {
            throw new NotFoundException(`Sucursal con ID ${sucursalIdActualizar} no encontrada`);
          }
          this.validarRangoHoras(horaInicioEspecial, horaFinEspecial, 'hora de inicio', 'hora de fin');
          break;

        case TipoExcepcion.HORARIO_ESPECIAL_BARBERO:
          if (!barberoIdActualizar) {
            throw new BadRequestException(
              'El campo barberoId es requerido para excepciones de tipo HORARIO_ESPECIAL_BARBERO',
            );
          }
          const horaInicioBarbero = updateDto.horaInicio || excepcion.horaInicio;
          const horaFinBarbero = updateDto.horaFin || excepcion.horaFin;
          if (!horaInicioBarbero || !horaFinBarbero) {
            throw new BadRequestException(
              'Los campos horaInicio y horaFin son requeridos para excepciones de tipo HORARIO_ESPECIAL_BARBERO',
            );
          }
          const barberoEspecial = await this.barberoRepository.findOne({
            where: { barberoId: barberoIdActualizar },
          });
          if (!barberoEspecial) {
            throw new NotFoundException(`Barbero con ID ${barberoIdActualizar} no encontrado`);
          }
          this.validarRangoHoras(horaInicioBarbero, horaFinBarbero, 'hora de inicio', 'hora de fin');
          break;
      }
    }

    // Validar fechas si se actualizan
    const fechaInicioActualizar = updateDto.fechaInicio ? new Date(updateDto.fechaInicio) : excepcion.fechaInicio;
    const fechaFinActualizar = updateDto.fechaFin !== undefined
      ? (updateDto.fechaFin ? new Date(updateDto.fechaFin) : null)
      : excepcion.fechaFin;

    if (fechaFinActualizar && fechaFinActualizar < fechaInicioActualizar) {
      throw new BadRequestException('La fecha de fin debe ser posterior o igual a la fecha de inicio');
    }

    // Actualizar fechas correctamente
    const updateData: any = { ...updateDto };
    if (updateDto.fechaInicio) {
      updateData.fechaInicio = new Date(updateDto.fechaInicio);
    }
    if (updateDto.fechaFin !== undefined) {
      updateData.fechaFin = updateDto.fechaFin ? new Date(updateDto.fechaFin) : null;
    }

    await this.excepcionRepository.update(id, updateData);
    const excepcionActualizada = await this.excepcionRepository.findOne({
      where: { excepcionId: id },
      relations: ['sucursal', 'barbero'],
    });
    if (!excepcionActualizada) {
      throw new NotFoundException(`Error al actualizar excepción con ID ${id}`);
    }
    return excepcionActualizada;
  }

  async deleteExcepcion(id: number): Promise<void> {
    const excepcion = await this.excepcionRepository.findOne({ where: { excepcionId: id } });
    if (!excepcion) {
      throw new NotFoundException(`Excepción con ID ${id} no encontrada`);
    }
    await this.excepcionRepository.delete(id);
  }

  // ========== CRUD PAUSAS DE BARBERO ==========

  async createPausa(createDto: CreatePausaBarberoDto): Promise<PausaBarbero> {
    // Validar que el barbero existe
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId: createDto.barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${createDto.barberoId} no encontrado`);
    }

    // Validar rango de horas
    this.validarRangoHoras(createDto.horaInicio, createDto.horaFin, 'hora de inicio', 'hora de fin');

    // Validar que no haya solapamiento con otras pausas activas del mismo día
    const pausasExistentes = await this.pausaBarberoRepository.find({
      where: {
        barberoId: createDto.barberoId,
        diaSemana: createDto.diaSemana,
        activo: true,
      },
    });

    const [nuevaHoraInicio, nuevoMinutoInicio] = createDto.horaInicio.split(':').map(Number);
    const [nuevaHoraFin, nuevoMinutoFin] = createDto.horaFin.split(':').map(Number);

    for (const pausa of pausasExistentes) {
      const [pausaHoraInicio, pausaMinutoInicio] = pausa.horaInicio.split(':').map(Number);
      const [pausaHoraFin, pausaMinutoFin] = pausa.horaFin.split(':').map(Number);

      const nuevaInicio = nuevaHoraInicio * 60 + nuevoMinutoInicio;
      const nuevaFin = nuevaHoraFin * 60 + nuevoMinutoFin;
      const pausaInicio = pausaHoraInicio * 60 + pausaMinutoInicio;
      const pausaFin = pausaHoraFin * 60 + pausaMinutoFin;

      // Verificar solapamiento
      if (
        (nuevaInicio >= pausaInicio && nuevaInicio < pausaFin) ||
        (nuevaFin > pausaInicio && nuevaFin <= pausaFin) ||
        (nuevaInicio <= pausaInicio && nuevaFin >= pausaFin)
      ) {
        throw new BadRequestException(
          `La pausa se solapa con otra pausa existente (${pausa.horaInicio} - ${pausa.horaFin})`,
        );
      }
    }

    const pausa = this.pausaBarberoRepository.create(createDto);
    return await this.pausaBarberoRepository.save(pausa);
  }

  async getPausasBarbero(barberoId: number, diaSemana?: number): Promise<PausaBarbero[]> {
    // Validar que el barbero existe
    const barbero = await this.barberoRepository.findOne({
      where: { barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${barberoId} no encontrado`);
    }

    const where: any = { barberoId, activo: true };
    if (diaSemana) {
      where.diaSemana = diaSemana;
    }

    return await this.pausaBarberoRepository.find({
      where,
      relations: ['barbero'],
      order: { diaSemana: 'ASC', horaInicio: 'ASC' },
    });
  }

  async updatePausa(id: number, updateDto: Partial<CreatePausaBarberoDto>): Promise<PausaBarbero> {
    const pausa = await this.pausaBarberoRepository.findOne({ where: { pausaId: id } });
    if (!pausa) {
      throw new NotFoundException(`Pausa con ID ${id} no encontrada`);
    }

    // Validar rango de horas si se actualizan
    if (updateDto.horaInicio && updateDto.horaFin) {
      this.validarRangoHoras(updateDto.horaInicio, updateDto.horaFin, 'hora de inicio', 'hora de fin');
    } else if (updateDto.horaInicio) {
      const horaFin = pausa.horaFin;
      this.validarRangoHoras(updateDto.horaInicio, horaFin, 'hora de inicio', 'hora de fin');
    } else if (updateDto.horaFin) {
      const horaInicio = pausa.horaInicio;
      this.validarRangoHoras(horaInicio, updateDto.horaFin, 'hora de inicio', 'hora de fin');
    }

    // Validar solapamiento con otras pausas si se actualiza horario o día
    if (updateDto.horaInicio || updateDto.horaFin || updateDto.diaSemana) {
      const barberoId = updateDto.barberoId !== undefined ? updateDto.barberoId : pausa.barberoId;
      const diaSemana = updateDto.diaSemana !== undefined ? updateDto.diaSemana : pausa.diaSemana;
      const horaInicio = updateDto.horaInicio || pausa.horaInicio;
      const horaFin = updateDto.horaFin || pausa.horaFin;

      const pausasExistentes = await this.pausaBarberoRepository.find({
        where: {
          barberoId,
          diaSemana,
          activo: true,
        },
      });

      const [nuevaHoraInicio, nuevoMinutoInicio] = horaInicio.split(':').map(Number);
      const [nuevaHoraFin, nuevoMinutoFin] = horaFin.split(':').map(Number);

      for (const pausaExistente of pausasExistentes) {
        if (pausaExistente.pausaId === id) continue; // Saltar la pausa actual

        const [pausaHoraInicio, pausaMinutoInicio] = pausaExistente.horaInicio.split(':').map(Number);
        const [pausaHoraFin, pausaMinutoFin] = pausaExistente.horaFin.split(':').map(Number);

        const nuevaInicio = nuevaHoraInicio * 60 + nuevoMinutoInicio;
        const nuevaFin = nuevaHoraFin * 60 + nuevoMinutoFin;
        const pausaInicio = pausaHoraInicio * 60 + pausaMinutoInicio;
        const pausaFin = pausaHoraFin * 60 + pausaMinutoFin;

        // Verificar solapamiento
        if (
          (nuevaInicio >= pausaInicio && nuevaInicio < pausaFin) ||
          (nuevaFin > pausaInicio && nuevaFin <= pausaFin) ||
          (nuevaInicio <= pausaInicio && nuevaFin >= pausaFin)
        ) {
          throw new BadRequestException(
            `La pausa se solapa con otra pausa existente (${pausaExistente.horaInicio} - ${pausaExistente.horaFin})`,
          );
        }
      }
    }

    await this.pausaBarberoRepository.update(id, updateDto);
    const pausaActualizada = await this.pausaBarberoRepository.findOne({
      where: { pausaId: id },
      relations: ['barbero'],
    });
    if (!pausaActualizada) {
      throw new NotFoundException(`Error al actualizar pausa con ID ${id}`);
    }
    return pausaActualizada;
  }

  async deletePausa(id: number): Promise<void> {
    const pausa = await this.pausaBarberoRepository.findOne({ where: { pausaId: id } });
    if (!pausa) {
      throw new NotFoundException(`Pausa con ID ${id} no encontrada`);
    }
    await this.pausaBarberoRepository.delete(id);
  }
}

