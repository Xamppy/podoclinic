import api from './axios';

export const pacientesService = {
  // Obtener todos los pacientes
  getAll: () => api.get('/pacientes/'),
  
  // Obtener un paciente por RUT
  getByRut: (rut) => api.get(`/pacientes/?rut=${rut}`),
  
  // Crear un nuevo paciente usando el endpoint con AllowAny
  create: (pacienteData) => {
    console.log('Enviando datos a crear_paciente_admin:', pacienteData);
    
    // Usar la URL completa del endpoint en lugar de una relativa
    return api.post('/pacientes/crear_paciente_admin/', pacienteData);
  },
  
  // Actualizar un paciente
  update: (rut, paciente) => api.put(`/pacientes/${rut}/`, paciente),
  
  // Eliminar un paciente
  delete: (rut) => api.delete(`/pacientes/${rut}/`),
  
  // Obtener ficha clínica
  getFichaClinica: async (rut) => {
    try {
      // Primero obtener el paciente por RUT usando el parámetro de consulta
      const pacienteResponse = await api.get(`/pacientes/?rut=${rut}`);
      if (!pacienteResponse.data || pacienteResponse.data.length === 0) {
        throw new Error('Paciente no encontrado');
      }
      const pacienteId = pacienteResponse.data[0].id;
      
      // Luego obtener las fichas clínicas usando el ID del paciente
      return api.get(`/pacientes/fichas/?paciente=${pacienteId}`);
    } catch (error) {
      console.error('Error al obtener fichas clínicas:', error);
      throw error;
    }
  },
  
  // Crear ficha clínica
  createFichaClinica: async (rut, ficha) => {
    try {
      // Primero obtener el paciente por RUT usando el parámetro de consulta
      const pacienteResponse = await api.get(`/pacientes/?rut=${rut}`);
      if (!pacienteResponse.data || pacienteResponse.data.length === 0) {
        throw new Error('Paciente no encontrado');
      }
      const pacienteId = pacienteResponse.data[0].id;
      
      // Luego crear la ficha clínica usando el ID del paciente
      return api.post(`/pacientes/fichas/`, { ...ficha, paciente: pacienteId });
    } catch (error) {
      console.error('Error al crear ficha clínica:', error);
      throw error;
    }
  },
}; 