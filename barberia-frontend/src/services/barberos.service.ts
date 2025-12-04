import api from './api';

export interface Barbero {
  barberoId: number;
  nombre: string;
  telefono?: string;
  sucursalId?: number;
  activo: boolean;
}

export const barberosService = {
  obtenerBarberos: async (sucursalId?: number): Promise<Barbero[]> => {
    const params = sucursalId ? `?sucursalId=${sucursalId}&activo=true` : '?activo=true';
    const response = await api.get<Barbero[]>(`/catalogo/barberos${params}`);
    return response.data;
  },
};
