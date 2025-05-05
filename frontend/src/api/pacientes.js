import api from './axios';

export const pacientesService = {
  // Obtener todos los pacientes
  getAll: () => api.get('/pacientes/'),
  
  // Obtener un paciente por RUT
  getByRut: (rut) => api.get(`/pacientes/${rut}/`),
  
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
  getFichaClinica: (rut) => api.get(`/pacientes/${rut}/ficha-clinica/`),
  
  // Crear ficha clínica
  createFichaClinica: (rut, ficha) => api.post(`/pacientes/${rut}/ficha-clinica/`, ficha),
}; 