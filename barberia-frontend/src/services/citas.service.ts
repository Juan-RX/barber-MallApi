import api from './api';

export interface ReservarCitaDto {
  servicioId: number;
  sucursalId: number;
  barberoId: number;
  clienteId?: number;
  fechaInicio: string;
  fechaFin: string;
  origen?: string;
  slotIdMall?: string;
  notas?: string;
}

export interface Cita {
  citaId: number;
  servicioId: number;
  clienteId: number;
  barberoId?: number;
  sucursalId?: number;
  fechaInicio: string;
  fechaFin: string;
  estadoCitaId: number;
  origen: string;
  slotIdMall?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
  servicio?: {
    servicioId: number;
    nombre: string;
    codigoExterno?: string;
  };
  cliente?: {
    clienteId: number;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  barbero?: {
    barberoId: number;
    nombre: string;
    apellido?: string;
  };
  sucursal?: {
    sucursalId: number;
    nombre: string;
  };
  estadoCita?: {
    estadoCitaId: number;
    codigo: string;
    descripcion?: string;
  };
}

export const citasService = {
  reservarCita: async (dto: ReservarCitaDto): Promise<Cita> => {
    const response = await api.post<Cita>('/citas/reservar', dto);
    return response.data;
  },

  obtenerTodasLasCitas: async (): Promise<Cita[]> => {
    const response = await api.get<Cita[]>('/citas');
    return response.data;
  },
};

