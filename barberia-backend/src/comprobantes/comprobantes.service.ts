import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comprobante } from '../entities/comprobante.entity';
import { Venta } from '../entities/venta.entity';
import { GenerarComprobanteDto } from './dto/generar-comprobante.dto';

@Injectable()
export class ComprobantesService {
  constructor(
    @InjectRepository(Comprobante)
    private comprobanteRepository: Repository<Comprobante>,
    @InjectRepository(Venta)
    private ventaRepository: Repository<Venta>,
  ) {}

  async generar(dto: GenerarComprobanteDto): Promise<Comprobante> {
    const venta = await this.ventaRepository.findOne({
      where: { ventaId: dto.ventaId },
      relations: ['cliente', 'sucursal', 'estadoVenta'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${dto.ventaId} no encontrada`);
    }

    const folio = dto.folio || venta.orderCode;
    const serie = dto.serie || 'WEB';

    const comprobante = this.comprobanteRepository.create({
      ventaId: venta.ventaId,
      folio,
      serie,
    });

    return this.comprobanteRepository.save(comprobante);
  }

  async obtenerPorVenta(ventaId: number): Promise<Comprobante[]> {
    return this.comprobanteRepository.find({
      where: { ventaId },
      order: { fechaGeneracion: 'DESC' },
    });
  }
}

