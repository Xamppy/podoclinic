import api from './axios';

export const insumosService = {
  // Obtener todos los insumos
  getAll: () => api.get('/insumos/'),
  
  // Obtener un insumo por ID
  getById: (id) => api.get(`/insumos/${id}/`),
  
  // Crear un nuevo insumo
  create: (insumo) => api.post('/insumos/', insumo),
  
  // Actualizar un insumo
  update: (id, insumo) => api.put(`/insumos/${id}/`, insumo),
  
  // Eliminar un insumo
  delete: (id) => api.delete(`/insumos/${id}/`),
  
  // Obtener insumos con stock crítico
  getStockCritico: () => api.get('/insumos/stock_critico/'),
  
  // Actualizar stock
  updateStock: (id, cantidad) => api.patch(`/insumos/${id}/stock/`, { cantidad }),
}; 