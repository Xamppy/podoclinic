import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';
import { getTouchTargetClasses, getTouchLoadingClasses } from '../utils/responsive';
import TouchButton from '../components/common/TouchButton';

const PacientesPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [rutOriginal, setRutOriginal] = useState(''); // Para rastrear el RUT original en modo edición
  const { rut, rutError, handleRutChange, setRut, verificandoExistencia, pacienteExistente } = useRut(rutOriginal);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

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

    // Verificar si existe un paciente con el mismo RUT
    if (pacienteExistente) {
      mostrarNotificacion('No se puede crear el paciente porque ya existe uno con este RUT', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await pacientesService.create({
        rut,
        ...formData
      });
      
      setShowForm(false);
      await cargarPacientes();
      
      // Limpiar formulario
      setRut('');
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (paciente) => {
    setSelectedPaciente(paciente);
    setRut(paciente.rut);
    setRutOriginal(paciente.rut); // Guardar el RUT original
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
    setRut(''); // Limpiar RUT también
    setRutOriginal(''); // Limpiar RUT original también
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
    
    setIsUpdating(true);
    
    try {
      // Preparar los datos para la actualización
      const datosActualizados = { 
        ...formData, 
        rut: rut, // Usar el RUT actual (que puede haber cambiado)
        rut_original: rutOriginal // Incluir el RUT original para identificar el paciente
      };
      
      // Manejar el campo fecha_nacimiento
      if (datosActualizados.fecha_nacimiento === '') {
        // Si es una cadena vacía, establecerlo como null
        datosActualizados.fecha_nacimiento = null;
      }
      
      console.log('RUT original:', rutOriginal);
      console.log('RUT nuevo:', rut);
      console.log('datos a enviar:', datosActualizados);
      
      // Enviar los datos usando el RUT original para identificar el paciente
      await pacientesService.update(rutOriginal, datosActualizados);
      
      setEditMode(false);
      setShowForm(false);
      await cargarPacientes();
      
      // Limpiar formulario
      setRut('');
      setRutOriginal('');
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
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (rut) => {
    // Mostrar un diálogo de confirmación
    if (window.confirm('¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.')) {
      setIsDeleting(rut);
      
      try {
        await pacientesService.delete(rut);
        
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
      } finally {
        setIsDeleting(null);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Pacientes</h1>
        <TouchButton
          onClick={() => {
            if (editMode) {
              handleCancelEdit();
            } else {
              if (showForm) {
                // Limpiar todo cuando se cancela
                setRut('');
                setRutOriginal('');
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
              }
              setShowForm(!showForm);
            }
          }}
          variant={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : 'Nuevo Paciente'}
        </TouchButton>
      </div>

      {showForm && (
        <form onSubmit={editMode ? handleUpdate : handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{editMode ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                RUT {editMode && (
                  <span className="text-xs text-blue-600 font-normal ml-2">
                    (Editable - puedes cambiar RUTs provisionales)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rut}
                  onChange={handleRutChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 ${
                    rutError 
                      ? 'border-red-300 focus:border-red-500' 
                      : pacienteExistente && (!editMode || rut !== rutOriginal)
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  placeholder="12.345.678-9"
                />
                {verificandoExistencia && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
              {pacienteExistente && !rutError && (!editMode || rut !== rutOriginal) && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {editMode ? 'RUT ya registrado' : 'Paciente ya registrado'}
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p><strong>Nombre:</strong> {pacienteExistente.nombre}</p>
                        <p><strong>Teléfono:</strong> {pacienteExistente.telefono}</p>
                        <p><strong>Correo:</strong> {pacienteExistente.correo}</p>
                        {editMode && (
                          <p className="mt-1 text-yellow-600">
                            <strong>No puedes cambiar a este RUT porque ya está en uso.</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <TouchButton
              type="button"
              onClick={editMode ? handleCancelEdit : () => setShowForm(false)}
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isSubmitting || isUpdating}
            >
              Cancelar
            </TouchButton>
            <TouchButton
              type="submit"
              disabled={
                isSubmitting || isUpdating || verificandoExistencia ||
                (!editMode && (rutError || pacienteExistente)) ||
                (editMode && (rutError || (pacienteExistente && rut !== rutOriginal)))
              }
              variant="primary"
              className="w-full sm:w-auto"
              loading={isSubmitting || isUpdating || verificandoExistencia}
            >
              {verificandoExistencia ? 'Verificando...' : 
               isSubmitting ? 'Guardando...' :
               isUpdating ? 'Actualizando...' :
               editMode ? 'Actualizar' : 'Guardar'}
            </TouchButton>
          </div>
        </form>
      )}

      {/* Desktop Table View (Large screens only) */}
      <div className="hidden xl:block bg-white shadow rounded-lg overflow-hidden">
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
                  <div className="flex space-x-2">
                    <TouchButton
                      variant="ghost"
                      size="small"
                      onClick={() => handleEditClick(paciente)}
                      disabled={isDeleting === paciente.rut}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </TouchButton>
                    <TouchButton
                      variant="ghost"
                      size="small"
                      onClick={() => handleDeleteClick(paciente.rut)}
                      disabled={isDeleting === paciente.rut}
                      loading={isDeleting === paciente.rut}
                      className="text-red-600 hover:text-red-900"
                    >
                      {isDeleting === paciente.rut ? 'Eliminando...' : 'Eliminar'}
                    </TouchButton>
                  </div>
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

      {/* Tablet Scrollable Table View */}
      <div className="hidden md:block xl:hidden bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">RUT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pacientes.length > 0 ? pacientes.map((paciente) => (
                <tr key={paciente.rut}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{paciente.rut}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{paciente.nombre}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{paciente.telefono}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{paciente.correo}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                    <div className="flex space-x-2">
                      <TouchButton
                        variant="outline"
                        size="small"
                        onClick={() => handleEditClick(paciente)}
                        disabled={isDeleting === paciente.rut}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        Editar
                      </TouchButton>
                      <TouchButton
                        variant="outline"
                        size="small"
                        onClick={() => handleDeleteClick(paciente.rut)}
                        disabled={isDeleting === paciente.rut}
                        loading={isDeleting === paciente.rut}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {isDeleting === paciente.rut ? 'Eliminando...' : 'Eliminar'}
                      </TouchButton>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                    No hay pacientes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Scroll indicator for tablets */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center border-t">
          ← Desliza horizontalmente para ver más información →
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {pacientes.length > 0 ? pacientes.map((paciente) => (
          <div key={paciente.rut} className="bg-white shadow rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{paciente.nombre}</h3>
                  <p className="text-sm text-gray-500">RUT: {paciente.rut}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Teléfono:</span>
                  <span className="text-sm text-gray-900">{paciente.telefono}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Correo:</span>
                  <span className="text-sm text-gray-900 break-all">{paciente.correo}</span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-3 border-t border-gray-200">
                <TouchButton
                  variant="primary"
                  onClick={() => handleEditClick(paciente)}
                  disabled={isDeleting === paciente.rut}
                  className="flex-1"
                >
                  Editar
                </TouchButton>
                <TouchButton
                  variant="danger"
                  onClick={() => handleDeleteClick(paciente.rut)}
                  disabled={isDeleting === paciente.rut}
                  loading={isDeleting === paciente.rut}
                  className="flex-1"
                >
                  {isDeleting === paciente.rut ? 'Eliminando...' : 'Eliminar'}
                </TouchButton>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay pacientes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacientesPage; 