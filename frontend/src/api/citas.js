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
      paciente: formData.paciente_rut,  // ID del paciente (el backend espera 'paciente', no 'paciente_rut')
      tratamiento: formData.tipo_tratamiento, // Tipo de tratamiento
      fecha: formData.fecha,
      hora: formData.hora,
      estado: 'reservada',  // Estado por defecto
      tipo_cita: formData.tipo_cita // Tipo de cita (podologia o manicura)
    };
    
    console.log('DATOS DE CITA A CREAR:', formData);
    console.log('Enviando datos a /citas/crear_cita_admin/:', backendData);
    
    // Usar la ruta correcta
    return api.post('/citas/crear_cita_admin/', backendData);
  },
  
  // Actualizar una cita - Usar el endpoint específico con AllowAny permissions
  update: (id, formData) => {
    // Convertir los datos del formulario al formato que espera el backend
    const backendData = {
      paciente: formData.paciente_rut,  // ID del paciente 
      tratamiento: formData.tipo_tratamiento, // Tipo de tratamiento
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado,
      tipo_cita: formData.tipo_cita || 'podologia' // Incluir tipo de cita, con valor por defecto
    };
    
    console.log('DATOS DE CITA A ACTUALIZAR:', formData);
    console.log('CAMPO tipo_cita (antes de enviar):', typeof formData.tipo_cita, formData.tipo_cita);
    console.log(`Actualizando cita ${id} con datos:`, backendData);
    
    return api.put(`/citas/actualizar/${id}/`, backendData);
  },
  
  // Eliminar una cita - Usar el endpoint específico con AllowAny permissions
  delete: (id) => api.delete(`/citas/eliminar/${id}/`),
  
  // Obtener horarios disponibles - Usando el nuevo endpoint
  getHorariosDisponibles: (fecha) => api.get(`/citas/disponibles/?fecha=${fecha}`),
}; 