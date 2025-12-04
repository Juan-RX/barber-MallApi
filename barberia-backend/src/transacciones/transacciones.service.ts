import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosError } from 'axios';
import { TransaccionPago } from '../entities/transaccion-pago.entity';
import { Venta } from '../entities/venta.entity';
import { CatEstadoTransaccion } from '../entities/catestadotransaccion.entity';
import { CatEstadoVenta } from '../entities/catestadoventa.entity';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { IniciarPagoDto } from './dto/iniciar-pago.dto';

type BancoEstado = 'APROBADA' | 'PENDIENTE' | 'RECHAZADA';

interface BancoRequestPayload {
  NumeroTarjetaOrigen: string;
  NumeroTarjetaDestino: string;
  NombreCliente: string;
  MesExp: number;
  AnioExp: number;
  Cvv: string;
  Monto: number;
}

type BancoRequestPayloadWithoutCvv = Omit<BancoRequestPayload, 'Cvv'>;

interface BancoResponseDatos {
  idTransaccion?: string;
  tipo?: string;
  monto?: number;
  numeroTarjeta?: string;
  estadoBancoId?: string;
  firma?: string;
  descripcion?: string;
  creadaUtc?: string;
}

@Injectable()
export class TransaccionesService {
  private readonly bancoApiUrl = process.env.BANCO_API_URL || 'http://localhost:5000/api/transacciones';
  private readonly bancoCuentaDestino = process.env.BANCO_CTA_DESTINO || '4111111111111113';
  private readonly bancoTimeoutMs = Number(process.env.BANCO_TIMEOUT_MS ?? 10000);

  constructor(
    @InjectRepository(TransaccionPago)
    private transaccionRepository: Repository<TransaccionPago>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
    @InjectRepository(CatEstadoTransaccion)
    private estadoTxRepository: Repository<CatEstadoTransaccion>,
    @InjectRepository(CatEstadoVenta)
    private estadoVentaRepository: Repository<CatEstadoVenta>,
  ) {}

  async createTransaccion(createTransaccionDto: CreateTransaccionDto): Promise<TransaccionPago> {
    // Validar que la venta existe
    const venta = await this.ventaRepository.findOne({
      where: { ventaId: createTransaccionDto.ventaId },
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${createTransaccionDto.ventaId} no encontrada`);
    }

    // Validar que el estado existe
    const estadoTx = await this.estadoTxRepository.findOne({
      where: { estadoTxId: createTransaccionDto.estadoTxId },
    });

    if (!estadoTx) {
      throw new NotFoundException(`Estado de transacción con ID ${createTransaccionDto.estadoTxId} no encontrado`);
    }

    const transaccion = this.transaccionRepository.create(createTransaccionDto);

    return await this.transaccionRepository.save(transaccion);
  }

  async findAllTransacciones(ventaId?: number): Promise<TransaccionPago[]> {
    const where = ventaId ? { ventaId } : {};
    return await this.transaccionRepository.find({
      where,
      relations: ['venta', 'estadoTx'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTransaccionById(id: number): Promise<TransaccionPago> {
    const transaccion = await this.transaccionRepository.findOne({
      where: { transaccionId: id },
      relations: ['venta', 'estadoTx'],
    });

    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }

    return transaccion;
  }

  async findTransaccionByExternalId(externalId: string): Promise<TransaccionPago> {
    const transaccion = await this.transaccionRepository.findOne({
      where: { transaccionExternaId: externalId },
      relations: ['venta', 'estadoTx'],
    });

    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID externo ${externalId} no encontrada`);
    }

    return transaccion;
  }

  async updateTransaccion(
    id: number,
    updateData: Partial<CreateTransaccionDto>,
  ): Promise<TransaccionPago> {
    await this.findTransaccionById(id);

    if (updateData.estadoTxId) {
      const estadoTx = await this.estadoTxRepository.findOne({
        where: { estadoTxId: updateData.estadoTxId },
      });

      if (!estadoTx) {
        throw new NotFoundException(`Estado de transacción con ID ${updateData.estadoTxId} no encontrado`);
      }
    }

    await this.transaccionRepository.update(id, updateData);
    return this.findTransaccionById(id);
  }

  async getTransaccionesPorVenta(ventaId: number): Promise<TransaccionPago[]> {
    const venta = await this.ventaRepository.findOne({
      where: { ventaId },
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${ventaId} no encontrada`);
    }

    return await this.transaccionRepository.find({
      where: { ventaId },
      relations: ['estadoTx'],
      order: { createdAt: 'DESC' },
    });
  }

  async iniciarPagoVenta(ventaId: number, pagoDto: IniciarPagoDto): Promise<TransaccionPago> {
    const venta = await this.ventaRepository.findOne({
      where: { ventaId },
      relations: ['cliente', 'sucursal', 'ventaLineas', 'ventaLineas.servicio', 'estadoVenta'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${ventaId} no encontrada`);
    }

    if (!venta.cliente) {
      throw new BadRequestException('La venta no tiene un cliente asociado');
    }

    if (!venta.sucursal) {
      throw new BadRequestException('La venta no tiene una sucursal asociada');
    }

    const estadoTransaccionPendiente = await this.findEstadoTransaccionByCodigo('PENDIENTE');
    const numeroTarjetaOrigen = pagoDto.NumeroTarjetaOrigen;
    if (!numeroTarjetaOrigen) {
      throw new BadRequestException('Debes proporcionar NumeroTarjetaOrigen para iniciar el pago');
    }

    const numeroTarjetaDestino = pagoDto.NumeroTarjetaDestino ?? this.bancoCuentaDestino;

    const nombreCliente = pagoDto.NombreCliente ?? venta.cliente?.nombre;
    if (!nombreCliente) {
      throw new BadRequestException('No se proporcionó el nombre del tarjetahabiente');
    }

    const monto = Number(pagoDto.Monto ?? venta.totalNeto ?? 0);
    if (!monto || monto <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    const transaccion = this.transaccionRepository.create({
      ventaId: venta.ventaId,
      codigoNegocio: venta.sucursal.codigoNegocio,
      transaccionExternaId: venta.orderCode,
      monto,
      estadoTxId: estadoTransaccionPendiente.estadoTxId,
    });

    const transaccionGuardada = await this.transaccionRepository.save(transaccion);

    const payload = this.construirPayloadBanco({
      NumeroTarjetaOrigen: numeroTarjetaOrigen,
      NumeroTarjetaDestino: numeroTarjetaDestino,
      NombreCliente: nombreCliente,
      MesExp: pagoDto.MesExp,
      AnioExp: pagoDto.AnioExp,
      Cvv: pagoDto.Cvv,
      Monto: monto,
    });
    const payloadSanitizado = this.sanitizarPayloadBanco(payload);
    let respuestaBanco: any;

    try {
      const response = await axios.post(this.bancoApiUrl, payload, {
        timeout: this.bancoTimeoutMs,
      });
      respuestaBanco = response.data;
    } catch (error) {
      const esErrorAxios = axios.isAxiosError(error);
      const axiosError = error as AxiosError;
      const respuestaError = esErrorAxios ? (axiosError.response?.data as any) : undefined;
      const mensajeError = esErrorAxios
        ? axiosError.message
        : 'Error desconocido al contactar al banco';

      const datosBancoError = this.extraerDatosBanco(respuestaError);

      await this.finalizarTransaccionBanco(
        transaccionGuardada.transaccionId,
        'RECHAZADA',
        payloadSanitizado,
        respuestaError ?? { mensaje: mensajeError },
        {
          transaccionExternaId: datosBancoError.idTransaccion ?? venta.orderCode,
          tipo: datosBancoError.tipo,
          monto: datosBancoError.monto,
          numeroTarjeta: datosBancoError.numeroTarjeta,
          estadoBancoId: datosBancoError.estadoBancoId,
          firma: datosBancoError.firma,
          descripcion: datosBancoError.descripcion,
          creadaUtc: datosBancoError.creadaUtc,
        },
      );
      await this.actualizarVentaTrasPago(venta.ventaId, 'RECHAZADA');

      throw new BadRequestException({
        message: 'Pago no aprobado',
        detalle:
          respuestaError?.descripcion ??
          respuestaError?.mensaje ??
          respuestaError?.message ??
          mensajeError,
        bancoResponse: respuestaError,
      });
    }

    const estadoBanco = this.mapEstadoBanco(respuestaBanco);
    const datosBanco = this.extraerDatosBanco(respuestaBanco);
    const transaccionExternaId = datosBanco.idTransaccion ?? venta.orderCode;

    await this.finalizarTransaccionBanco(
      transaccionGuardada.transaccionId,
      estadoBanco,
      payloadSanitizado,
      respuestaBanco,
      {
      transaccionExternaId,
        tipo: datosBanco.tipo,
        monto: datosBanco.monto,
        numeroTarjeta: datosBanco.numeroTarjeta,
        estadoBancoId: datosBanco.estadoBancoId,
        firma: datosBanco.firma,
        descripcion: datosBanco.descripcion,
        creadaUtc: datosBanco.creadaUtc,
      },
    );

    await this.actualizarVentaTrasPago(venta.ventaId, estadoBanco);

    if (estadoBanco === 'RECHAZADA') {
      throw new BadRequestException({
        message: 'Pago no aprobado',
        detalle:
          datosBanco.descripcion ??
          respuestaBanco?.mensaje ??
          respuestaBanco?.message ??
          'Pago rechazado por el banco',
        bancoResponse: respuestaBanco,
      });
    }

    const transaccionFinal = await this.transaccionRepository.findOne({
      where: { transaccionId: transaccionGuardada.transaccionId },
      relations: ['venta', 'estadoTx'],
    });

    return this.limpiarRespuestaTransaccion(transaccionFinal);
  }

  private limpiarRespuestaTransaccion(transaccion: TransaccionPago | null): TransaccionPago {
    if (!transaccion) {
      return transaccion;
    }

    const copia = JSON.parse(JSON.stringify(transaccion));
    delete copia.bancoPayload;

    return copia;
  }

  private construirPayloadBanco(datos: BancoRequestPayload): BancoRequestPayload {
    return {
      NumeroTarjetaOrigen: datos.NumeroTarjetaOrigen,
      NumeroTarjetaDestino: datos.NumeroTarjetaDestino,
      NombreCliente: datos.NombreCliente,
      MesExp: datos.MesExp,
      AnioExp: datos.AnioExp,
      Cvv: datos.Cvv,
      Monto: datos.Monto,
    };
  }

  private sanitizarPayloadBanco(payload: BancoRequestPayload): BancoRequestPayloadWithoutCvv {
    const { Cvv, ...resto } = payload;
    return resto;
  }

  private extraerDatosBanco(respuesta: any): BancoResponseDatos {
    if (!respuesta) {
      return {};
    }

    const montoBruto =
      respuesta?.monto ??
      respuesta?.Monto ??
      respuesta?.amount ??
      respuesta?.Amount ??
      respuesta?.MontoTransaccion;
    const montoNormalizado =
      typeof montoBruto === 'number' ? montoBruto : Number(montoBruto);

    return {
      idTransaccion: this.obtenerIdTransaccionBanco(respuesta),
      tipo: respuesta?.tipo ?? respuesta?.Tipo ?? respuesta?.TipoTransaccion,
      monto: Number.isFinite(montoNormalizado) ? Number(montoNormalizado) : undefined,
      numeroTarjeta:
        respuesta?.numero_tarjeta ??
        respuesta?.NumeroTarjeta ??
        respuesta?.tarjeta,
      estadoBancoId:
        respuesta?.id_estado_transaccion ??
        respuesta?.estado ??
        respuesta?.NombreEstado ??
        respuesta?.status ??
        respuesta?.resultado ??
        respuesta?.decision,
      firma: respuesta?.firma ?? respuesta?.Firma,
      descripcion:
        respuesta?.descripcion ??
        respuesta?.Descripcion ??
        respuesta?.mensaje ??
        respuesta?.message,
      creadaUtc:
        respuesta?.creada_utc ??
        respuesta?.CreadaUtc ??
        respuesta?.CreadaUTC ??
        respuesta?.created_at,
    };
  }

  private obtenerIdTransaccionBanco(respuesta: any): string | undefined {
    const candidato =
      respuesta?.id_transaccion ??
      respuesta?.IdTransaccion ??
      respuesta?.transaccionId ??
      respuesta?.idTransaccion ??
      respuesta?.Transaccion ??
      respuesta?.transaccion_externa;

    if (candidato === undefined || candidato === null) {
      return undefined;
    }

    return typeof candidato === 'string' ? candidato : candidato.toString();
  }

  private async finalizarTransaccionBanco(
    transaccionId: number,
    estadoBanco: BancoEstado,
    requestPayload: BancoRequestPayloadWithoutCvv,
    responsePayload: any,
    cambios?: {
      transaccionExternaId?: string;
      tipo?: string;
      monto?: number;
      numeroTarjeta?: string;
      estadoBancoId?: string;
      firma?: string;
      descripcion?: string;
      creadaUtc?: string;
    },
  ): Promise<void> {
    const estadoTx = await this.findEstadoTransaccionByCodigo(estadoBanco);
    const payloadGuardado = JSON.stringify({
      request: requestPayload,
      response: responsePayload,
    });

    const updateData: Partial<TransaccionPago> = {
      estadoTxId: estadoTx.estadoTxId,
      bancoPayload: payloadGuardado,
    };

    if (cambios?.transaccionExternaId) {
      updateData.transaccionExternaId = cambios.transaccionExternaId;
    }

    if (cambios?.tipo) {
      updateData.tipo = cambios.tipo;
    }

    if (typeof cambios?.monto === 'number' && Number.isFinite(cambios.monto)) {
      updateData.monto = cambios.monto;
    }

    if (cambios?.numeroTarjeta) {
      updateData.numeroTarjeta = cambios.numeroTarjeta;
    }

    if (cambios?.estadoBancoId) {
      updateData.estadoBancoId = cambios.estadoBancoId.toString();
    }

    if (cambios?.firma) {
      updateData.firma = cambios.firma;
    }

    if (cambios?.descripcion) {
      updateData.descripcion = cambios.descripcion;
    }

    if (cambios?.creadaUtc) {
      const fecha = new Date(cambios.creadaUtc);
      if (!Number.isNaN(fecha.getTime())) {
        updateData.creadaUtc = fecha;
      }
    }

    await this.transaccionRepository.update(transaccionId, updateData);
  }

  private mapEstadoBanco(respuesta: any): BancoEstado {
    const datosNormalizados = this.extraerDatosBanco(respuesta);
    const valorEstado =
      datosNormalizados.estadoBancoId ??
      respuesta?.NombreEstado ??
      respuesta?.nombre_estado ??
      respuesta?.estado ??
      respuesta?.status ??
      respuesta?.resultado ??
      respuesta?.decision ??
      '';
    const estadoRaw =
      typeof valorEstado === 'string'
        ? valorEstado.toUpperCase()
        : valorEstado?.toString
        ? valorEstado.toString().toUpperCase()
        : '';

    if (
      estadoRaw.includes('APROB') ||
      estadoRaw.includes('COMPLET') ||
      estadoRaw.includes('EXITOS') ||
      estadoRaw === 'SUCCESS' ||
      estadoRaw === 'APPROVED'
    ) {
      return 'APROBADA';
    }

    if (
      estadoRaw.includes('PEND') ||
      estadoRaw === 'EN_PROCESO' ||
      estadoRaw === 'PROCESSING' ||
      estadoRaw === 'PENDING'
    ) {
      return 'PENDIENTE';
    }

    return 'RECHAZADA';
  }

  private async actualizarVentaTrasPago(
    ventaId: number,
    estadoBanco: BancoEstado,
  ): Promise<void> {
    let codigoEstadoVenta: string | null = null;

    if (estadoBanco === 'APROBADA') {
      codigoEstadoVenta = 'PAGADA';
    } else if (estadoBanco === 'RECHAZADA') {
      codigoEstadoVenta = 'CANCELADA';
    }

    if (!codigoEstadoVenta) {
      return;
    }

    const camposUpdate: Partial<Venta> = {};
    const estadoVentaId = await this.getEstadoVentaIdByCodigo(codigoEstadoVenta);
    if (estadoVentaId) {
      camposUpdate.estadoVentaId = estadoVentaId;
    }

    if (estadoBanco === 'APROBADA') {
      const timestamp = Date.now();
      camposUpdate.confirmationCode = `CONF-${ventaId}-${timestamp}`;
      camposUpdate.confirmationCodeCreatedAt = `${camposUpdate.confirmationCode}-${new Date().toISOString()}`;
    }

    await this.ventaRepository.update(ventaId, camposUpdate);
  }

  private async getEstadoVentaIdByCodigo(codigo: string): Promise<number | null> {
    const estadoVenta = await this.estadoVentaRepository.findOne({
      where: { codigo },
    });

    return estadoVenta ? estadoVenta.estadoVentaId : null;
  }

  private async findEstadoTransaccionByCodigo(codigo: string): Promise<CatEstadoTransaccion> {
    const estado = await this.estadoTxRepository.findOne({
      where: { codigo },
    });

    if (!estado) {
      throw new BadRequestException(`No existe un estado de transacción con código ${codigo}`);
    }

    return estado;
  }

}
