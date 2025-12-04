import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cita } from '../entities/cita.entity';
import { Servicio } from '../entities/servicio.entity';
import { Barbero } from '../entities/barbero.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { Cliente } from '../entities/cliente.entity';
import { CatEstadoCita } from '../entities/catestadocita.entity';
import { ReservarCitaDto } from './dto/reservar-cita.dto';
import { HorarioService } from '../disponibilidad/horario.service';

@Injectable()
export class CitasService {
  private readonly estadosBloqueo = ['RESERVADA', 'CONFIRMADA'];

  constructor(
    @InjectRepository(Cita)
    private readonly citaRepository: Repository<Cita>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(Barbero)
    private readonly barberoRepository: Repository<Barbero>,
    @InjectRepository(Sucursal)
    private readonly sucursalRepository: Repository<Sucursal>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(CatEstadoCita)
    private readonly estadoCitaRepository: Repository<CatEstadoCita>,
    private readonly horarioService: HorarioService,
  ) {}

  async reservarCita(dto: ReservarCitaDto): Promise<Cita> {
    const servicio = await this.servicioRepository.findOne({
      where: { servicioId: dto.servicioId },
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${dto.servicioId} no encontrado`);
    }

    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalId: dto.sucursalId },
    });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${dto.sucursalId} no encontrada`);
    }

    const barbero = await this.barberoRepository.findOne({
      where: { barberoId: dto.barberoId },
    });
    if (!barbero) {
      throw new NotFoundException(`Barbero con ID ${dto.barberoId} no encontrado`);
    }
    if (barbero.sucursalId !== dto.sucursalId) {
      throw new BadRequestException(`El barbero ${dto.barberoId} no pertenece a la sucursal ${dto.sucursalId}`);
    }

    let cliente: Cliente | null = null;
    if (dto.clienteId) {
      cliente = await this.clienteRepository.findOne({
        where: { clienteId: dto.clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${dto.clienteId} no encontrado`);
      }
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);
    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no tienen un formato válido');
    }
    if (fechaInicio >= fechaFin) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    await this.validarSlotDisponible(dto.sucursalId, dto.barberoId, fechaInicio, fechaFin);

    const estadoReservadaId = await this.getEstadoCitaIdByCodigo('RESERVADA');

    const cita = this.citaRepository.create({
      servicioId: servicio.servicioId,
      clienteId: cliente?.clienteId,
      barberoId: barbero.barberoId,
      sucursalId: sucursal.sucursalId,
      fechaInicio,
      fechaFin,
      estadoCitaId: estadoReservadaId,
      origen: dto.origen || 'MALL',
      slotIdMall: dto.slotIdMall,
      notas: dto.notas,
    });

    return this.citaRepository.save(cita);
  }

  async confirmarCita(citaId: number): Promise<Cita> {
    const cita = await this.obtenerCitaPorId(citaId);
    const estadoConfirmadaId = await this.getEstadoCitaIdByCodigo('CONFIRMADA');

    await this.citaRepository.update(cita.citaId, { estadoCitaId: estadoConfirmadaId });
    return this.obtenerCitaPorId(cita.citaId);
  }

  async cancelarCita(citaId: number, motivo?: string): Promise<Cita> {
    await this.obtenerCitaPorId(citaId);
    const estadoCanceladaId = await this.getEstadoCitaIdByCodigo('CANCELADA');

    await this.citaRepository.update(citaId, {
      estadoCitaId: estadoCanceladaId,
      notas: motivo,
    });
    return this.obtenerCitaPorId(citaId);
  }

  async obtenerCitaPorId(citaId: number): Promise<Cita> {
    const cita = await this.citaRepository.findOne({
      where: { citaId },
      relations: ['servicio', 'cliente', 'barbero', 'sucursal', 'estadoCita'],
    });
    if (!cita) {
      throw new NotFoundException(`Cita con ID ${citaId} no encontrada`);
    }
    return cita;
  }

  /**
   * Obtiene todas las citas con sus relaciones
   */
  async obtenerTodasLasCitas(): Promise<Cita[]> {
    return await this.citaRepository.find({
      relations: ['servicio', 'cliente', 'barbero', 'sucursal', 'estadoCita'],
      order: { citaId: 'DESC' },
    });
  }

  async encontrarBarberoDisponible(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Barbero | null> {
    const barberos = await this.barberoRepository.find({
      where: { sucursalId, activo: true },
      order: { barberoId: 'ASC' },
    });

    for (const barbero of barberos) {
      const horarioValido = await this.tieneHorarioDisponibleParaSlot(
        sucursalId,
        barbero.barberoId,
        fechaInicio,
        fechaFin,
      );
      if (!horarioValido) {
        continue;
      }

      const disponible = await this.esSlotDisponibleParaBarbero(
        sucursalId,
        barbero.barberoId,
        fechaInicio,
        fechaFin,
      );

      if (disponible) {
        return barbero;
      }
    }

    return null;
  }

  async barberoTieneHorarioParaSlot(
    sucursalId: number,
    barberoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean> {
    return this.tieneHorarioDisponibleParaSlot(sucursalId, barberoId, fechaInicio, fechaFin);
  }

  async barberoSlotLibre(
    sucursalId: number,
    barberoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean> {
    return this.esSlotDisponibleParaBarbero(sucursalId, barberoId, fechaInicio, fechaFin);
  }

  private async tieneHorarioDisponibleParaSlot(
    sucursalId: number,
    barberoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean> {
    const horario = await this.horarioService.calcularHorarioDisponible(
      sucursalId,
      barberoId,
      fechaInicio,
    );

    if (!horario) {
      return false;
    }

    const slotInicioMin = fechaInicio.getHours() * 60 + fechaInicio.getMinutes();
    const slotFinMin = fechaFin.getHours() * 60 + fechaFin.getMinutes();
    const horarioInicioMin = horario.horaInicio * 60 + horario.minutoInicio;
    const horarioFinMin = horario.horaFin * 60 + horario.minutoFin;

    if (slotInicioMin < horarioInicioMin || slotFinMin > horarioFinMin) {
      return false;
    }

    return true;
  }

  private async validarSlotDisponible(
    sucursalId: number,
    barberoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<void> {
    const estados = await this.estadoCitaRepository.find({
      where: { codigo: In(this.estadosBloqueo) },
    });
    const estadoIds = estados.map((estado) => estado.estadoCitaId);
    if (estadoIds.length === 0) {
      throw new BadRequestException('No hay estados de cita configurados para validar disponibilidad');
    }

    const overlap = await this.citaRepository
      .createQueryBuilder('cita')
      .where('cita.sucursalId = :sucursalId', { sucursalId })
      .andWhere('cita.barberoId = :barberoId', { barberoId })
      .andWhere('cita.estadoCitaId IN (:...estadoIds)', { estadoIds })
      .andWhere('cita.fechaInicio < :fechaFin AND cita.fechaFin > :fechaInicio', {
        fechaInicio,
        fechaFin,
      })
      .getCount();

    if (overlap > 0) {
      throw new BadRequestException('El slot seleccionado ya fue reservado por otra persona');
    }
  }

  private async esSlotDisponibleParaBarbero(
    sucursalId: number,
    barberoId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<boolean> {
    try {
      await this.validarSlotDisponible(sucursalId, barberoId, fechaInicio, fechaFin);
      return true;
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message?.includes('ya fue reservado')
      ) {
        return false;
      }
      throw error;
    }
  }

  async getEstadoCitaIdByCodigo(codigo: string): Promise<number> {
    const estado = await this.estadoCitaRepository.findOne({
      where: { codigo },
    });
    if (!estado) {
      throw new BadRequestException(`No existe un estado de cita con código ${codigo}`);
    }
    return estado.estadoCitaId;
  }
}

