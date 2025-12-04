import api from './api';

export interface Servicio {
  servicioId: number;
  storeId?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
}

export const serviciosService = {
  obtenerServicios: async (sucursalId?: number): Promise<Servicio[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}&activo=true` : '?activo=true';
    const response = await api.get<Servicio[]>(`/catalogo/servicios${params}`);
    return response.data;
  },
};

