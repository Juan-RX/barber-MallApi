import api from './api';

export interface VentaLineaRequest {
  tipoItem: 'SERVICIO' | 'PRODUCTO';
  servicioId?: number;
  productoId?: number;
  citaId?: number;
  quantity?: number;
  priceUnit: number;
  discountAmount?: number;
  serviceExternalId?: string;
  productExternalId?: string;
  appointmentTime?: string;
}

export interface CreateVentaDto {
  clienteId?: number;
  sucursalId: number;
  estadoVentaId: number;
  totalBruto?: number;
  descuentoTotal?: number;
  totalNeto?: number;
  origen?: string;
  comentarios?: string;
  ventaLineas: VentaLineaRequest[];
}

export interface VentaLineaResponse {
  ventaLineaId: number;
  tipoItem: string;
  servicioId?: number;
  productoId?: number;
  priceUnit: number;
  discountAmount: number;
  priceTotal: number;
  citaId?: number;
}

export interface VentaLinea {
  ventaLineaId: number;
  ventaId: number;
  tipoItem: 'SERVICIO' | 'PRODUCTO';
  servicioId?: number;
  productoId?: number;
  citaId?: number;
  quantity: number;
  priceUnit: number;
  discountAmount: number;
  priceTotal: number;
  serviceExternalId?: string;
  productExternalId?: string;
  appointmentTime?: string;
  size?: string;
  color?: string;
  options?: string;
  createdAt?: string;
  venta?: Venta;
  servicio?: {
    servicioId: number;
    nombre: string;
    codigoExterno?: string;
  };
  producto?: {
    productoId: number;
    nombre: string;
    codigoExterno?: string;
  };
  cita?: {
    citaId: number;
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface Venta {
  ventaId: number;
  orderCode: string;
  clienteId?: number;
  sucursalId: number;
  estadoVentaId: number;
  totalBruto: number;
  descuentoTotal: number;
  totalNeto: number;
  origen: string;
  comentarios?: string;
  confirmationCode?: string;
  confirmationCodeCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  cliente?: {
    clienteId: number;
    nombre: string;
    email?: string;
  };
  sucursal?: {
    sucursalId: number;
    nombre: string;
  };
  estadoVenta?: {
    estadoVentaId: number;
    codigo: string;
    descripcion?: string;
  };
  ventaLineas?: VentaLinea[];
}

export interface VentaResponse {
  ventaId: number;
  orderCode: string;
  clienteId?: number;
  sucursalId: number;
  estadoVentaId: number;
  totalBruto: number;
  descuentoTotal: number;
  totalNeto: number;
  origen: string;
  ventaLineas: VentaLineaResponse[];
}

export const ventasService = {
  crearVenta: async (dto: CreateVentaDto): Promise<VentaResponse> => {
    const response = await api.post<VentaResponse>('/ventas', dto);
    return response.data;
  },
  cancelarVenta: async (ventaId: number, motivo?: string): Promise<VentaResponse> => {
    const response = await api.post<VentaResponse>(`/ventas/${ventaId}/cancelar`, {
      motivo,
    });
    return response.data;
  },
  obtenerTodasLasVentas: async (): Promise<Venta[]> => {
    const response = await api.get<Venta[]>('/ventas');
    return response.data;
  },
  obtenerTodasLasVentaLineas: async (): Promise<VentaLinea[]> => {
    const response = await api.get<VentaLinea[]>('/ventas/lineas');
    return response.data;
  },
};


