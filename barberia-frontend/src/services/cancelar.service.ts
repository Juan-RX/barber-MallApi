import api from './api';

export const citasApi = {
  cancelarCita: async (citaId: number): Promise<void> => {
    await api.post(`/citas/${citaId}/cancelar`);
  },
};

