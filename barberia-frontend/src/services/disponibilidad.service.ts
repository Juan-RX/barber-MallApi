import api from './api';

export interface SlotDisponible {
  barberoId?: number;
  barberoNombre?: string;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  disponible: boolean;
}

export interface CheckDisponibilidadDto {
  servicioId: number;
  sucursalId: number;
  fechaInicio: string;
  fechaFin: string;
  barberoId?: number;
}

export const disponibilidadService = {
  checkDisponibilidad: async (dto: CheckDisponibilidadDto): Promise<SlotDisponible[]> => {
    const response = await api.post<SlotDisponible[]>('/disponibilidad/check', dto);
    return response.data;
  },
};

