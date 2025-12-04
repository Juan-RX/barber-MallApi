import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Cliente {
  clienteId: number;
  nombre: string;
  email?: string;
  telefono?: string;
  codigoExterno?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  cliente?: Cliente;
  token?: string;
}

export const authService = {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Guarda la información del cliente en localStorage
   */
  saveCliente(cliente: Cliente): void {
    localStorage.setItem('cliente', JSON.stringify(cliente));
    localStorage.setItem('isAuthenticated', 'true');
  },

  /**
   * Obtiene el cliente autenticado desde localStorage
   */
  getCliente(): Cliente | null {
    const clienteStr = localStorage.getItem('cliente');
    if (!clienteStr) return null;
    try {
      return JSON.parse(clienteStr);
    } catch {
      return null;
    }
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  },

  /**
   * Cierra sesión
   */
  logout(): void {
    localStorage.removeItem('cliente');
    localStorage.removeItem('isAuthenticated');
  },
};

