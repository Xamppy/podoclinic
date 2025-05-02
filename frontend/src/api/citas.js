import api from './axios';

export const citasService = {
  // Obtener todas las citas
  getAll: () => api.get('/citas/'),
  
  // Obtener citas por fecha
  getByFecha: (fecha) => api.get(`/citas/?fecha=${fecha}`),
  
  // Obtener citas por paciente
  getByPaciente: (rut) => api.get(`/citas/?paciente=${rut}`),
  
  // Crear una nueva cita
  create: (cita) => api.post('/citas/', cita),
  
  // Actualizar una cita
  update: (id, cita) => api.put(`/citas/${id}/`, cita),
  
  // Eliminar una cita
  delete: (id) => api.delete(`/citas/${id}/`),
  
  // Obtener horarios disponibles
  getHorariosDisponibles: (fecha) => api.get(`/citas/horarios-disponibles/?fecha=${fecha}`),
}; 