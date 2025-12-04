import api from './api';

export interface Cliente {
  clienteId: number;
  nombre: string;
  email?: string;
  telefono?: string;
  codigoExterno?: string;
}

export interface BuscarClienteParams {
  email?: string;
  telefono?: string;
  codigoExterno?: string;
}

export interface CrearClienteDto {
  nombre: string;
  email?: string;
  telefono?: string;
  codigoExterno?: string;
}

export const clientesService = {
  buscar: async (params: BuscarClienteParams): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes', { params });
    return response.data;
  },
  crear: async (dto: CrearClienteDto): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', dto);
    return response.data;
  },
};


