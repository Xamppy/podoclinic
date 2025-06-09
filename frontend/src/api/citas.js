import api from './axios';

export const citasService = {
  // Obtener todas las citas
  getAll: () => api.get('/citas/'),
  
  // Obtener citas por fecha
  getByFecha: (fecha) => api.get(`/citas/?fecha=${fecha}`),
  
  // Obtener citas por paciente
  getByPaciente: (rut) => api.get(`/citas/?paciente=${rut}`),
  
  // Crear una nueva cita - utilizando el endpoint específico para la admin
  create: (formData) => {
    // Convertir los datos del formulario al formato que espera el backend
    const backendData = {
      paciente: formData.paciente_rut,
      tratamiento: formData.tipo_tratamiento,
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado || 'reservada',
      tipo_cita: formData.tipo_cita || 'podologia',
      duracion_cita: 60
    };
    
    console.log('DATOS DE CITA A CREAR:', formData);
    console.log('Datos preparados para el backend:', backendData);
    
    return api.post('/citas/crear_cita_admin/', backendData);
  },
  
  // Actualizar una cita - Usar el endpoint específico para admin
  update: (id, formData) => {
    // Convertir los datos del formulario al formato que espera el backend
    const backendData = {
      paciente: formData.paciente_rut,
      tratamiento: formData.tipo_tratamiento,
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado || 'reservada',
      tipo_cita: formData.tipo_cita || 'podologia',
      duracion_cita: 60
    };
    
    console.log('DATOS DE CITA A ACTUALIZAR:', formData);
    console.log('Datos preparados para el backend:', backendData);
    
    return api.put(`/citas/actualizar/${id}/`, backendData);
  },
  
  // Eliminar una cita - Usar el endpoint específico con AllowAny permissions
  delete: (id) => api.delete(`/citas/eliminar/${id}/`),
  
  // Obtener horarios disponibles - Usando el nuevo endpoint
  getHorariosDisponibles: (fecha, tipoCita = 'podologia') => {
    console.log(`🔍 SOLICITANDO HORARIOS: fecha=${fecha}, tipo_cita=${tipoCita}`);
    return api.get(`/citas/disponibles/?fecha=${fecha}&tipo_cita=${tipoCita}`);
  },
}; 