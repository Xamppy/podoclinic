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
  
  // Actualizar un paciente usando el endpoint admin
  update: (rut, paciente) => {
    // Verificar que el RUT esté presente
    const pacienteData = { ...paciente };
    if (!pacienteData.rut) {
      pacienteData.rut = rut;
    }
    
    console.log('Enviando datos a actualizar_paciente_admin:', pacienteData);
    
    // Asegurarse de que el RUT esté incluido en los datos
    return api.put('/pacientes/actualizar_paciente_admin/', pacienteData);
  },
  
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

  // Actualizar ficha clínica
  updateFichaClinica: async (id, ficha) => {
    try {
      console.log('Enviando datos para actualizar ficha:', ficha);
      
      // Validar que los productos usados estén correctamente formateados
      if (ficha.productos_usados && Array.isArray(ficha.productos_usados)) {
        console.log(`Enviando ${ficha.productos_usados.length} productos usados:`, ficha.productos_usados);
        ficha.productos_usados.forEach((producto, index) => {
          console.log(`Producto ${index + 1}:`, producto);
          if (!producto.insumo) {
            console.error(`Error: Producto ${index + 1} no tiene ID de insumo`);
          }
          if (!producto.cantidad) {
            console.error(`Error: Producto ${index + 1} no tiene cantidad`);
          }
        });
      } else {
        console.log('No se están enviando productos usados o el formato es incorrecto');
      }
      
      const response = await api.put(`/pacientes/fichas/${id}/`, ficha);
      console.log('Respuesta de actualización:', response.data);
      return response;
    } catch (error) {
      console.error('Error al actualizar ficha clínica:', error);
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        console.error('Cabeceras:', error.response.headers);
      }
      throw error;
    }
  }
}; 