import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';

const PacientesPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const { rut, rutError, handleRutChange, setRut } = useRut();
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    enfermedad_base: '',
    contacto_emergencia: '',
    caso_clinico: '',
    direccion: '',
    fecha_nacimiento: ''
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
        caso_clinico: '',
        direccion: '',
        fecha_nacimiento: ''
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

  const handleEditClick = (paciente) => {
    setSelectedPaciente(paciente);
    setRut(paciente.rut);
    setFormData({
      nombre: paciente.nombre || '',
      telefono: paciente.telefono || '',
      correo: paciente.correo || '',
      enfermedad_base: paciente.enfermedad_base || '',
      contacto_emergencia: paciente.contacto_emergencia || '',
      caso_clinico: paciente.caso_clinico || '',
      direccion: paciente.direccion || '',
      fecha_nacimiento: paciente.fecha_nacimiento || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setShowForm(false);
    setSelectedPaciente(null);
    // Limpiar formulario
    setFormData({
      nombre: '',
      telefono: '',
      correo: '',
      enfermedad_base: '',
      contacto_emergencia: '',
      caso_clinico: '',
      direccion: '',
      fecha_nacimiento: ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      // Mostrar mensaje de carga
      const loadingMsg = mostrarNotificacion('Actualizando paciente...', 'info');
      
      // Preparar los datos para la actualización
      const datosActualizados = { ...formData, rut: selectedPaciente.rut };
      
      // Manejar el campo fecha_nacimiento
      if (datosActualizados.fecha_nacimiento === '') {
        // Si es una cadena vacía, establecerlo como null
        datosActualizados.fecha_nacimiento = null;
      }
      
      console.log('rut a actualizar:', selectedPaciente.rut);
      console.log('datos a enviar:', datosActualizados);
      
      // Enviar los datos incluyendo explícitamente el RUT
      await pacientesService.update(selectedPaciente.rut, datosActualizados);
      
      // Eliminar mensaje de carga si aún existe
      if (document.body.contains(loadingMsg)) {
        document.body.removeChild(loadingMsg);
      }
      
      setEditMode(false);
      setShowForm(false);
      await cargarPacientes();
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        telefono: '',
        correo: '',
        enfermedad_base: '',
        contacto_emergencia: '',
        caso_clinico: '',
        direccion: '',
        fecha_nacimiento: ''
      });
      
      mostrarNotificacion('Paciente actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      
      // Mostrar información detallada del error
      let mensajeError = 'Error al actualizar el paciente';
      
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

  const handleDeleteClick = async (rut) => {
    // Mostrar un diálogo de confirmación
    if (window.confirm('¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.')) {
      try {
        // Mostrar mensaje de carga
        const loadingMsg = mostrarNotificacion('Eliminando paciente...', 'info');
        
        await pacientesService.delete(rut);
        
        // Eliminar mensaje de carga si aún existe
        if (document.body.contains(loadingMsg)) {
          document.body.removeChild(loadingMsg);
        }
        
        // Recargar la lista de pacientes
        await cargarPacientes();
        
        mostrarNotificacion('Paciente eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error al eliminar paciente:', error);
        
        // Mostrar información detallada del error
        let mensajeError = 'Error al eliminar el paciente';
        
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
          onClick={() => {
            if (editMode) {
              handleCancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo Paciente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={editMode ? handleUpdate : handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">{editMode ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">RUT</label>
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="12.345.678-9"
                disabled={editMode}
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={editMode ? handleCancelEdit : () => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {editMode ? 'Actualizar' : 'Guardar'}
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
                  <button 
                    className="text-indigo-600 hover:text-indigo-900 mr-3" 
                    onClick={() => handleEditClick(paciente)}
                  >
                    Editar
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteClick(paciente.rut)}
                  >
                    Eliminar
                  </button>
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