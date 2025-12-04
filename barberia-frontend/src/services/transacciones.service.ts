import api from './api';

export interface IniciarPagoDto {
  NumeroTarjetaOrigen: string;
  NumeroTarjetaDestino?: string;
  NombreCliente?: string;
  MesExp: number;
  AnioExp: number;
  Cvv: string;
  Monto?: number;
}

export interface TransaccionResponse {
  transaccionId: number;
  ventaId: number;
  transaccionExternaId?: string;
  estadoTxId: number;
  monto: number;
  tipo?: string;
  descripcion?: string;
}

export interface TransaccionPago {
  transaccionId: number;
  ventaId: number;
  codigoNegocio: string;
  transaccionExternaId: string;
  tipo?: string;
  monto: number;
  descripcion?: string;
  estadoTxId: number;
  numeroTarjeta?: string;
  estadoBancoId?: string;
  firma?: string;
  creadaUtc?: string;
  bancoPayload?: string;
  createdAt?: string;
  updatedAt?: string;
  venta?: {
    ventaId: number;
    orderCode: string;
    totalNeto: number;
  };
  estadoTx?: {
    estadoTxId: number;
    codigo: string;
    descripcion: string;
  };
}

export const transaccionesService = {
  iniciarPagoVenta: async (
    ventaId: number,
    dto: IniciarPagoDto,
  ): Promise<TransaccionResponse> => {
    const response = await api.post<TransaccionResponse>(
      `/transacciones/venta/${ventaId}/pagar`,
      dto,
    );
    return response.data;
  },
  obtenerTodasLasTransacciones: async (): Promise<TransaccionPago[]> => {
    const response = await api.get<TransaccionPago[]>('/transacciones');
    return response.data;
  },
};


