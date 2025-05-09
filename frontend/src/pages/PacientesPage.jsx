import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';

const PacientesPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { rut, rutError, handleRutChange } = useRut();
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    enfermedad_base: '',
    contacto_emergencia: '',
    caso_clinico: ''
  });
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });

  useEffect(() => {
    cargarPacientes();
  }, []);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    // Determinar clase CSS basada en el tipo de notificación
    let claseBase = 'fixed z-50 p-4 rounded-md shadow-lg max-w-md';
    let claseColor;
    
    switch (tipo) {
      case 'error':
        claseColor = 'bg-red-500 text-white';
        break;
      case 'success':
        claseColor = 'bg-green-500 text-white';
        break;
      case 'warning':
        claseColor = 'bg-yellow-500 text-white';
        break;
      case 'info':
      default:
        claseColor = 'bg-blue-500 text-white';
        break;
    }
    
    // Crear el elemento de notificación
    const notification = document.createElement('div');
    notification.className = `${claseBase} ${claseColor} top-4 right-4`;
    notification.textContent = mensaje;
    
    // Añadir a la página
    document.body.appendChild(notification);
    
    // Eliminar después de un tiempo
    const duracion = tipo === 'error' ? 8000 : 3000;
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, duracion);
    
    return notification;
  };

  const cargarPacientes = async () => {
    try {
      const response = await pacientesService.getAll();
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      mostrarNotificacion('Error al cargar la lista de pacientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rutError) {
      mostrarNotificacion(rutError, 'error');
      return;
    }

    try {
      // Mostrar mensaje de carga
      const loadingMsg = mostrarNotificacion('Creando paciente...', 'info');
      
      const response = await pacientesService.create({
        rut,
        ...formData
      });
      
      // Eliminar mensaje de carga si aún existe
      if (document.body.contains(loadingMsg)) {
        document.body.removeChild(loadingMsg);
      }
      
      setShowForm(false);
      await cargarPacientes();
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        telefono: '',
        correo: '',
        enfermedad_base: '',
        contacto_emergencia: '',
        caso_clinico: ''
      });
      
      mostrarNotificacion('Paciente creado exitosamente', 'success');
    } catch (error) {
      console.error('Error al crear paciente:', error);
      
      // Mostrar información detallada del error
      let mensajeError = 'Error al crear el paciente';
      
      if (error.response) {
        console.log('Detalles del error:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
        
        if (error.response.data && error.response.data.error) {
          mensajeError = error.response.data.error;
        } else if (error.response.data && typeof error.response.data === 'string') {
          mensajeError = error.response.data;
        }
      }
      
      mostrarNotificacion(mensajeError, 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo Paciente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">RUT</label>
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="12.345.678-9"
              />
              {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Enfermedad Base</label>
              <input
                type="text"
                value={formData.enfermedad_base}
                onChange={(e) => setFormData({ ...formData, enfermedad_base: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contacto de Emergencia</label>
              <input
                type="text"
                value={formData.contacto_emergencia}
                onChange={(e) => setFormData({ ...formData, contacto_emergencia: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Caso Clínico</label>
              <textarea
                value={formData.caso_clinico}
                onChange={(e) => setFormData({ ...formData, caso_clinico: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Guardar Paciente
            </button>
          </div>
        </form>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pacientes.length > 0 ? pacientes.map((paciente) => (
              <tr key={paciente.rut}>
                <td className="px-6 py-4 whitespace-nowrap">{paciente.rut}</td>
                <td className="px-6 py-4 whitespace-nowrap">{paciente.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{paciente.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">{paciente.correo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                  <button className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No hay pacientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PacientesPage; 