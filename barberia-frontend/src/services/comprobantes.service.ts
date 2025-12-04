import api from './api';

export interface Comprobante {
  comprobanteId: number;
  ventaId: number;
  fechaGeneracion: string;
  serie?: string;
  folio?: string;
}

export interface GenerarComprobanteDto {
  ventaId: number;
  serie?: string;
  folio?: string;
}

export const comprobantesService = {
  generar: async (dto: GenerarComprobanteDto): Promise<Comprobante> => {
    const response = await api.post<Comprobante>('/comprobantes/generar', dto);
    return response.data;
  },
};

