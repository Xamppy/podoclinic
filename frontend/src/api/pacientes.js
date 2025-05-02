import api from './axios';

export const pacientesService = {
  // Obtener todos los pacientes
  getAll: () => api.get('/pacientes/'),
  
  // Obtener un paciente por RUT
  getByRut: (rut) => api.get(`/pacientes/${rut}/`),
  
  // Crear un nuevo paciente
  create: (paciente) => api.post('/pacientes/', paciente),
  
  // Actualizar un paciente
  update: (rut, paciente) => api.put(`/pacientes/${rut}/`, paciente),
  
  // Eliminar un paciente
  delete: (rut) => api.delete(`/pacientes/${rut}/`),
  
  // Obtener ficha clínica
  getFichaClinica: (rut) => api.get(`/pacientes/${rut}/ficha-clinica/`),
  
  // Crear ficha clínica
  createFichaClinica: (rut, ficha) => api.post(`/pacientes/${rut}/ficha-clinica/`, ficha),
}; 