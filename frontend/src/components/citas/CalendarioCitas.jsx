import React, { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axiosInstance from '../../api/axios';
import { citasService } from '../../api/citas';
import { pacientesService } from '../../api/pacientes';
import { useWhatsApp } from '../../context/WhatsAppContext';
import './CalendarioCitas.css'; // Importamos CSS personalizado

// Configuración del locale para español
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipos de tratamientos disponibles
const TIPOS_TRATAMIENTO = {
  podologia: [
    'Podología general',
    'Uñas con hongos (Onicomicosis)',
    'Uña encarnada (Onicocriptosis)',
    'Curación Podología',
    'Dermatomicoticos',
    'Postura de brackets',
    'Helomas interdigitales'
  ],
  manicura: [
    'Manicura'
  ]
};

const CalendarioCitas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const { enviarConfirmacionCita } = useWhatsApp();
  
  // Estados para la edición y eliminación
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    estado: '',
    tipo_cita: 'podologia', // Agregar tipo de cita
    original_hora: ''
  });
  
  // Estados para la actualización automática
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const autoRefreshInterval = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });

  // Configuración de horarios
  const minTime = new Date();
  minTime.setHours(9, 0, 0); // 9:00 AM

  const maxTime = new Date();
  maxTime.setHours(19, 0, 0); // 7:00 PM

  // Configuración de días laborables (0 = domingo, 1 = lunes, ..., 6 = sábado)
  const dayLayoutAlgorithm = 'no-overlap';
  const step = 60; // Intervalos de 1 hora
  const timeslots = 1;

  const [formData, setFormData] = useState({
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    tipo_cita: 'podologia' // Agregar tipo de cita
  });

  useEffect(() => {
    cargarDatos();
    
    // Iniciar el intervalo de actualización automática
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        if (!modalOpen) {
          cargarDatos();
          setLastUpdate(new Date());
        }
      }, 30000); // Actualizar cada 30 segundos
    }
    
    // Limpiar el intervalo cuando se desmonte el componente
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh, modalOpen]);
  
  // Efecto para controlar el estado de los modales
  useEffect(() => {
    // Cualquier modal abierto detiene la actualización automática
    const isAnyModalOpen = showForm || showEditForm || showDeleteConfirm || !!selectedEvent;
    setModalOpen(isAnyModalOpen);
  }, [showForm, showEditForm, showDeleteConfirm, selectedEvent]);

  const cargarDatos = async () => {
    try {
      const [citasRes, pacientesRes] = await Promise.all([
        citasService.getAll(),
        pacientesService.getAll()
      ]);
      
      // Transformar las citas para el formato del calendario
      const citasFormateadas = Array.isArray(citasRes.data) 
        ? citasRes.data.map(cita => {
            console.log('Cita original del backend:', cita); // Ver los datos originales
            console.log('tipo_cita en backend:', typeof cita.tipo_cita, cita.tipo_cita);
            
            // Crear una copia del objeto cita con tipo_cita asegurado
            const citaConTipo = {
              ...cita,
              tipo_cita: cita.tipo_cita || 'podologia' // Asegurar que tiene tipo_cita
            };
            
            console.log('Cita procesada para calendario:', citaConTipo);
            
            return {
                id: cita.id,
                title: `${cita.paciente_nombre} - ${cita.tipo_tratamiento || cita.tratamiento_nombre}`,
                start: new Date(`${cita.fecha}T${cita.hora}`),
                end: new Date(new Date(`${cita.fecha}T${cita.hora}`).getTime() + (cita.tratamiento?.duracion_minutos || 60) * 60000),
                paciente: cita.paciente_nombre,
                paciente_rut: cita.paciente_rut,
                tratamiento: cita.tipo_tratamiento || cita.tratamiento_nombre,
                estado: cita.estado,
                resource: citaConTipo, // Usar la copia con tipo_cita asegurado
            }
        })
        : [];
      
      setCitas(citasFormateadas);
      setPacientes(pacientesRes.data);
      
      // Mostrar notificación solo si no es la carga inicial
      if (!loading) {
        mostrarNotificacion('Citas actualizadas correctamente', 'success');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setCitas([]);
      if (!loading) {
        mostrarNotificacion('Error al actualizar citas', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Función para mostrar notificaciones
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    setNotificacion({
      visible: true,
      mensaje,
      tipo
    });
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      setNotificacion(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Función para alternar la actualización automática
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // Detener la actualización automática
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
      setAutoRefresh(false);
      mostrarNotificacion('Actualización automática desactivada', 'info');
    } else {
      // Iniciar la actualización automática
      setAutoRefresh(true);
      mostrarNotificacion('Actualización automática activada', 'success');
    }
  };

  const handleSelectEvent = (event) => {
    console.log('Cita seleccionada:', event);
    console.log('Datos completos de la cita:', event.resource);
    setSelectedEvent(event);
  };

  const handleSelectSlot = async (slotInfo) => {
    console.log("Slot seleccionado:", slotInfo);
    
    const start = new Date(slotInfo.start);
    setSelectedDate(start);
    
    // Formatear la fecha para la API
    const fechaFormateada = format(start, 'yyyy-MM-dd');
    
    setFormData(prev => ({ 
      ...prev, 
      fecha: fechaFormateada
    }));
    
    try {
      // Usamos un enfoque más simple para depurar el problema
      // Generamos horarios fijos entre 9:00 y 18:00 para evitar errores del backend
      const horariosGenerados = [];
      for (let hora = 9; hora <= 18; hora++) {
        horariosGenerados.push(`${hora.toString().padStart(2, '0')}:00`);
      }
      
      setHorariosDisponibles(horariosGenerados);
      setShowForm(true);
      
      // Luego intentamos obtener los horarios reales del backend
      try {
        const response = await axiosInstance.get(`/citas/disponibles/?fecha=${fechaFormateada}`);
        console.log("Respuesta de horarios:", response.data);
        
        if (response.data && response.data.horas_disponibles) {
          setHorariosDisponibles(response.data.horas_disponibles);
        }
      } catch (apiError) {
        console.error('Error al obtener horarios desde la API:', apiError);
        // No mostramos alerta porque ya estamos mostrando horarios generados
      }
    } catch (error) {
      console.error('Error general al procesar la selección de fecha:', error);
      alert('Error al preparar el formulario de cita');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Enviando datos de cita:", formData);
      const response = await citasService.create(formData);
      console.log("Respuesta de creación:", response.data);
      
      try {
        await enviarConfirmacionCita(response.data);
      } catch (whatsappError) {
        console.error('Error al enviar confirmación por WhatsApp:', whatsappError);
        // Continuamos aunque falle el envío de WhatsApp
      }
      
      setShowForm(false);
      cargarDatos();
      setFormData({
        paciente_rut: '',
        fecha: '',
        hora: '',
        tipo_tratamiento: '',
        tipo_cita: 'podologia' // Agregar tipo de cita
      });
      
      alert('Cita creada con éxito');
    } catch (error) {
      console.error('Error al crear cita:', error);
      alert('Error al crear la cita. Por favor, intente nuevamente.');
    }
  };

  // Personalización de los eventos en el calendario
  const eventStyleGetter = (event) => {
    // Verificar si event y event.resource existen para evitar errores
    if (!event) {
      return {
        style: {
          backgroundColor: '#3788d8', // color por defecto
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }
    
    // Forzar color rosa para citas específicas por ID
    if (event.id === 11 || event.id === 13) {
      console.log(`Forzando color rosa para cita ID ${event.id}`);
      return {
        style: {
          backgroundColor: '#ec4899', // Color rosa para manicura
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }
    
    // Verificar tipo_cita en event.resource si existe
    if (event.resource && event.resource.tipo_cita === 'manicura') {
      console.log(`Asignando color rosa para cita de manicura (resource): ${event.id}`);
      return {
        style: {
          backgroundColor: '#ec4899', // Color rosa para manicura
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }
    
    // Verificar por título si contiene "Manicura"
    if (event.title && event.title.includes('Manicura')) {
      console.log(`Asignando color rosa para cita de manicura (título): ${event.id}`);
      return {
        style: {
          backgroundColor: '#ec4899', // Color rosa para manicura
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }
    
    // Color por defecto azul para podología
    return {
      style: {
        backgroundColor: '#3788d8', // color azul por defecto
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Función para editar una cita
  const handleEditCita = () => {
    if (!selectedEvent) return;
    
    // Preparar los datos para el formulario de edición
    const fecha = format(selectedEvent.start, 'yyyy-MM-dd');
    const hora = format(selectedEvent.start, 'HH:mm');
    
    setEditFormData({
      id: selectedEvent.id,
      paciente_rut: selectedEvent.paciente_rut || '',
      fecha: fecha,
      hora: hora,
      tipo_tratamiento: selectedEvent.tratamiento || '',
      estado: selectedEvent.estado || 'reservada',
      tipo_cita: selectedEvent.resource.tipo_cita || 'podologia', // Asegurarnos de incluir el tipo de cita
      original_hora: hora // Guardar la hora original para resaltarla en el selector
    });
    
    // Cargar horarios disponibles para la fecha seleccionada
    cargarHorariosDisponibles(fecha, selectedEvent.id);
    
    // Cerrar el modal de detalles y abrir el de edición
    setSelectedEvent(null);
    setShowEditForm(true);
  };
  
  // Función para cargar horarios disponibles para edición
  const cargarHorariosDisponibles = async (fecha, citaId = null) => {
    try {
      const response = await citasService.getHorariosDisponibles(fecha);
      
      if (response.data && response.data.horas_disponibles) {
        // Si estamos editando, incluir la hora actual de la cita en los horarios disponibles
        if (citaId && editFormData.hora) {
          // Normalizar la hora actual para comparación
          const horaActualNormalizada = editFormData.hora.split(':').slice(0, 2).join(':');
          
          let horasDisponiblesActualizadas = [...response.data.horas_disponibles];
          
          // Añadir la hora actual si no está en la lista
          if (!horasDisponiblesActualizadas.includes(horaActualNormalizada)) {
            horasDisponiblesActualizadas.push(horaActualNormalizada);
            // Ordenar las horas disponibles
            horasDisponiblesActualizadas.sort();
          }
          
          setHorariosDisponibles(horasDisponiblesActualizadas);
        } else {
          setHorariosDisponibles(response.data.horas_disponibles);
        }
      } else {
        setHorariosDisponibles([]);
      }
    } catch (error) {
      console.error('Error al cargar horarios disponibles:', error);
      setHorariosDisponibles([]);
      mostrarNotificacion('Error al cargar horarios disponibles', 'error');
    }
  };
  
  // Función para manejar el envío del formulario de edición
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verificar que el tipo_cita está presente
      if (!editFormData.tipo_cita) {
        console.warn("Tipo de cita no está presente, asignando 'podologia' por defecto");
        editFormData.tipo_cita = 'podologia';
      }
      
      console.log("Actualizando cita con datos:", editFormData);
      
      // Llamar al servicio de actualización de citas
      await citasService.update(editFormData.id, {
        paciente_rut: editFormData.paciente_rut,
        tipo_tratamiento: editFormData.tipo_tratamiento,
        fecha: editFormData.fecha,
        hora: editFormData.hora,
        estado: editFormData.estado,
        tipo_cita: editFormData.tipo_cita
      });
      
      // Actualizar la lista de citas
      cargarDatos();
      // Cerrar el formulario de edición
      setShowEditForm(false);
      // Mostrar notificación de éxito
      mostrarNotificacion('Cita actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      mostrarNotificacion('Error al actualizar la cita', 'error');
    }
  };
  
  // Función para eliminar una cita
  const handleDeleteCita = () => {
    if (!selectedEvent) return;
    
    // Cerrar el modal de detalles y abrir el de confirmación de eliminación
    setShowDeleteConfirm(true);
    setSelectedEvent(null);
  };
  
  // Función para confirmar la eliminación de una cita
  const confirmarEliminarCita = async () => {
    try {
      // Llamar al servicio de eliminación de citas
      await citasService.delete(editFormData.id);
      
      // Actualizar la lista de citas
      cargarDatos();
      // Cerrar el modal de confirmación
      setShowDeleteConfirm(false);
      // Mostrar notificación de éxito
      mostrarNotificacion('Cita eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      mostrarNotificacion('Error al eliminar la cita', 'error');
    }
  };

  // Agregar función para manejar el cambio de tipo de cita
  const handleChangeTipoCita = (e) => {
    setFormData({
      ...formData,
      tipo_cita: e.target.value,
      tipo_tratamiento: '' // Resetear el tratamiento al cambiar el tipo de cita
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando calendario...</div>;
  }

  return (
    <div className="h-screen p-4">
      <h2 className="text-2xl font-semibold mb-4">Calendario de Citas</h2>
      
      {/* Controles y estado de actualización */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={cargarDatos} 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <button 
            onClick={toggleAutoRefresh} 
            className={`px-3 py-1 ${autoRefresh ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {autoRefresh ? 'Auto On' : 'Auto Off'}
          </button>
        </div>
        {autoRefresh && (
          <div className="text-sm text-gray-600">
            Última actualización: {format(lastUpdate, 'HH:mm:ss')}
          </div>
        )}
      </div>
      
      {/* Notificación */}
      {notificacion.visible && (
        <div className={`fixed top-4 right-4 p-3 rounded shadow-lg z-50 ${
          notificacion.tipo === 'success' ? 'bg-green-500 text-white' :
          notificacion.tipo === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notificacion.mensaje}
        </div>
      )}
      
      <div className="h-5/6 bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={citas}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          defaultView="month"
          views={['month', 'week', 'day', 'agenda']}
          min={minTime}
          max={maxTime}
          step={step}
          timeslots={timeslots}
          dayLayoutAlgorithm={dayLayoutAlgorithm}
          className="calendar-hover-pointer" // Clase CSS personalizada para el cursor
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            allDay: "Todo el día",
            work_week: "Semana laboral",
            yesterday: "Ayer",
            tomorrow: "Mañana",
            noEventsInRange: "No hay eventos en este rango.",
            showMore: total => `+ Ver más (${total})`,
            // Personalización de los días
            dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
            dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
          }}
          culture="es"
        />
      </div>
      
      {/* Modal para detalles de cita */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-2">{selectedEvent.title}</h3>
            <p><strong>Paciente:</strong> {selectedEvent.paciente}</p>
            <p><strong>Tratamiento:</strong> {selectedEvent.tratamiento}</p>
            <p><strong>Fecha:</strong> {format(selectedEvent.start, 'dd/MM/yyyy')}</p>
            <p><strong>Hora:</strong> {format(selectedEvent.start, 'HH:mm')}</p>
            <p><strong>Estado:</strong> {selectedEvent.resource.estado}</p>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleEditCita}
              >
                Editar
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDeleteCita}
              >
                Eliminar
              </button>
              <button 
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar cita */}
      {showEditForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Cita
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditForm(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cita</label>
                <select
                  value={editFormData.tipo_cita}
                  onChange={(e) => setEditFormData({ ...editFormData, tipo_cita: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="podologia">Podología</option>
                  <option value="manicura">Manicura</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  value={editFormData.paciente_rut}
                  onChange={(e) => setEditFormData({ ...editFormData, paciente_rut: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="">Seleccione un paciente</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.rut} value={paciente.rut}>
                      {paciente.nombre} - {paciente.rut}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tratamiento</label>
                <select
                  value={editFormData.tipo_tratamiento}
                  onChange={(e) => setEditFormData({ ...editFormData, tipo_tratamiento: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="">Seleccione un tratamiento</option>
                  {TIPOS_TRATAMIENTO[editFormData.tipo_cita || 'podologia'].map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editFormData.fecha}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, fecha: e.target.value });
                    cargarHorariosDisponibles(e.target.value, editFormData.id);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la Cita</label>
                <select
                  value={editFormData.estado}
                  onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="reservada">Reservada</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                {horariosDisponibles.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {horariosDisponibles.map(hora => (
                      <button
                        key={hora}
                        type="button"
                        className={`py-2 px-3 rounded-md text-center transition-colors ${
                          editFormData.hora === hora 
                            ? 'bg-indigo-600 text-white' 
                            : editFormData.original_hora === hora
                            ? 'bg-yellow-100 text-gray-800 border border-yellow-500 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        onClick={() => setEditFormData({ ...editFormData, hora })}
                      >
                        {hora}{editFormData.original_hora === hora ? ' (original)' : ''}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">No hay horarios disponibles para esta fecha</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={!editFormData.hora || !editFormData.paciente_rut || !editFormData.tipo_tratamiento || !editFormData.fecha}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar cita */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">¿Eliminar esta cita?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Esta acción eliminará permanentemente la cita y no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center mt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarCita}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Nueva Cita - {format(selectedDate, 'dd/MM/yyyy')}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowForm(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cita</label>
                <select
                  value={formData.tipo_cita}
                  onChange={handleChangeTipoCita}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="podologia">Podología</option>
                  <option value="manicura">Manicura</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select
                  value={formData.paciente_rut}
                  onChange={(e) => setFormData({ ...formData, paciente_rut: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="">Seleccione un paciente</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.rut} value={paciente.rut}>
                      {paciente.nombre} - {paciente.rut}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tratamiento</label>
                <select
                  value={formData.tipo_tratamiento}
                  onChange={(e) => setFormData({ ...formData, tipo_tratamiento: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                  required
                >
                  <option value="">Seleccione un tratamiento</option>
                  {TIPOS_TRATAMIENTO[formData.tipo_cita].map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                {horariosDisponibles.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {horariosDisponibles.map(hora => (
                      <button
                        key={hora}
                        type="button"
                        className={`py-2 px-3 rounded-md text-center transition-colors ${
                          formData.hora === hora 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        onClick={() => setFormData({ ...formData, hora })}
                      >
                        {hora}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">No hay horarios disponibles para esta fecha</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={!formData.hora || !formData.paciente_rut || !formData.tipo_tratamiento}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioCitas;