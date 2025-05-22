import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { format as formatDate } from 'date-fns';
import { citasService } from '../api/citas';
import { pacientesService } from '../api/pacientes';
import { useWhatsApp } from '../context/WhatsAppContext';
import './AdminCitasPage.css';
import axiosInstance from '../api/axios';

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

const AdminCitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const { enviarConfirmacionCita } = useWhatsApp();
  const [currentView, setCurrentView] = useState('month');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    estado: '',
    original_hora: '',
    duracion_extendida: false,
    original_duracion_extendida: false
  });

  const [formData, setFormData] = useState({
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    tipo_cita: 'podologia',
    duracion_extendida: false
  });

  const [horasOcupadas, setHorasOcupadas] = useState([]);

  // Cuando el componente se monta, cargar datos una sola vez
  useEffect(() => {
    cargarDatos();
  }, []);  // No es necesario añadir cargarDatos como dependencia ya que solo queremos ejecutarlo una vez al montar

  // Función para cargar datos
  const cargarDatos = async () => {
    try {
      // Usar el endpoint de depuración para obtener las citas
      const [citasRes, pacientesRes] = await Promise.all([
        axiosInstance.get('/citas/debug/'),
        pacientesService.getAll()
      ]);

      console.log('Respuesta de citas (debug):', citasRes.data);
      
      let citasData = [];
      
      // Procesar los datos de citas desde el endpoint de depuración
      if (citasRes.data && citasRes.data.citas) {
        citasData = citasRes.data.citas;
      }

      console.log('Citas procesadas:', citasData);

      // Verificar y formatear cada cita
      const citasFormateadas = citasData.map(cita => {
        if (!cita.id || !cita.fecha || !cita.hora) {
          console.warn('Cita con datos incompletos:', cita);
          return null;
        }

        // Asegurarse de que la hora tenga el formato correcto (HH:MM)
        let horaFormateada = cita.hora;
        if (horaFormateada && horaFormateada.includes(':')) {
          const partes = horaFormateada.split(':');
          if (partes.length >= 2) {
            horaFormateada = `${partes[0]}:${partes[1]}`;
          }
        }

        return {
          ...cita,
          fecha: cita.fecha,
          hora: horaFormateada,
          tipo_cita: cita.tipo_cita || 'podologia',
          paciente_nombre: cita.paciente_nombre || 'Sin nombre',
          tipo_tratamiento: cita.tratamiento_nombre || cita.tipo_tratamiento || 'Sin tratamiento'
        };
      }).filter(cita => cita !== null);

      console.log('Citas formateadas finales:', citasFormateadas);
      
      // Establecer las citas en el estado
      setCitas(citasFormateadas);
      
      // Establecer los pacientes
      if (Array.isArray(pacientesRes.data)) {
        setPacientes(pacientesRes.data);
      } else {
        console.warn('Datos de pacientes no válidos:', pacientesRes.data);
        setPacientes([]);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      setCitas([]);
      setPacientes([]);
      mostrarNotificacion('Error al cargar las citas', 'error');
    } finally {
      setLoading(false);
    }
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
      // Primero establecer un estado de carga para evitar parpadeo
      setHorariosDisponibles([]);
      setShowForm(true);
      
      // Obtener los horarios desde el backend
      try {
        const response = await axiosInstance.get(`/citas/disponibles/?fecha=${fechaFormateada}`);
        console.log("Respuesta de horarios:", response.data);
        
        if (response.data && response.data.horas_disponibles) {
          setHorariosDisponibles(response.data.horas_disponibles);
          
          // Obtener también las citas existentes para esa fecha
          try {
            const citasResponse = await citasService.getByFecha(fechaFormateada);
            console.log("Citas en la fecha seleccionada:", citasResponse.data);
            
            if (citasResponse.data && Array.isArray(citasResponse.data)) {
              // Inicializar un array para todas las horas ocupadas
              let todasHorasOcupadas = [];
              
              // Procesar las citas para obtener todas las horas ocupadas
              citasResponse.data.forEach(c => {
                let hora = c.hora;
                if (hora && hora.includes(':')) {
                  const partes = hora.split(':');
                  if (partes.length >= 2) {
                    hora = `${partes[0]}:${partes[1]}`;
                  }
                }
                
                // Añadir la hora principal
                todasHorasOcupadas.push(hora);
                
                // Si la cita tiene duración extendida, añadir también la hora siguiente
                if (c.duracion_extendida) {
                  const [horaH, horaM] = hora.split(':').map(Number);
                  const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
                  todasHorasOcupadas.push(siguienteHora);
                }
              });
              
              console.log("Todas las horas ocupadas (incluyendo duración extendida):", todasHorasOcupadas);
              setHorasOcupadas(todasHorasOcupadas);
              
              // Filtrar los horarios disponibles eliminando todas las horas ocupadas
              if (response.data.horas_disponibles.length > 0) {
                const horariosActualizados = response.data.horas_disponibles.filter(
                  hora => !todasHorasOcupadas.includes(hora)
                );
                setHorariosDisponibles(horariosActualizados);
              }
            }
          } catch (error) {
            console.error("Error al cargar citas para la fecha:", error);
          }
        }
      } catch (apiError) {
        console.error('Error al obtener horarios desde la API:', apiError);
        // Si hay error, generamos horarios fijos como fallback
        const horariosGenerados = [];
        for (let hora = 9; hora <= 18; hora++) {
          horariosGenerados.push(`${hora.toString().padStart(2, '0')}:00`);
        }
        setHorariosDisponibles(horariosGenerados);
      }
    } catch (error) {
      console.error('Error general al procesar la selección de fecha:', error);
      alert('Error al preparar el formulario de cita');
    }
  };

  const handleSelectEvent = (event) => {
    // Buscar la cita completa por ID
    const cita = citas.find(c => c.id === event.id);
    if (cita) {
      console.log('Cita seleccionada en AdminCitasPage:', event);
      console.log('Datos completos de la cita:', cita);
      setSelectedCita(cita);
      setShowDetailModal(true);
    }
  };

  const handleViewChange = (view) => {
    console.log('Vista cambiada a:', view);
    setCurrentView(view);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Enviando datos de cita:", formData);
      
      // Validación adicional
      if (!formData.paciente_rut) {
        alert('Por favor, seleccione un paciente');
        return;
      }
      
      if (!formData.tipo_tratamiento) {
        alert('Por favor, seleccione un tipo de tratamiento');
        return;
      }
      
      if (!formData.hora) {
        alert('Por favor, seleccione una hora');
        return;
      }
      
      // Mostrar mensaje de carga
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md z-50';
      loadingMsg.textContent = 'Creando cita...';
      document.body.appendChild(loadingMsg);
      
      // Intento de creación de cita
      try {
        const response = await citasService.create(formData);
        console.log("Respuesta de creación:", response.data);
        
        try {
          await enviarConfirmacionCita(response.data);
        } catch (whatsappError) {
          console.error('Error al enviar confirmación por WhatsApp:', whatsappError);
        }
        
        setShowForm(false);
        
        // Formatear la nueva cita antes de agregarla al estado
        const paciente = pacientes.find(p => p.rut === formData.paciente_rut);
        const nuevaCita = {
          ...response.data,
          paciente_nombre: paciente ? paciente.nombre : 'Sin nombre',
          tipo_tratamiento: formData.tipo_tratamiento,
          hora: formData.hora.substring(0, 5), // Asegurar formato HH:MM
          tipo_cita: formData.tipo_cita,
          duracion_extendida: formData.duracion_extendida
        };
        
        // Agregar la nueva cita al estado local
        setCitas(prevCitas => [...prevCitas, nuevaCita]);
        
        // Si la cita tiene duración extendida, añadir la hora siguiente a las horas ocupadas
        if (formData.duracion_extendida) {
          const [horaH, horaM] = formData.hora.split(':').map(Number);
          const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
          
          // Actualizar la lista de horas ocupadas
          setHorasOcupadas(prevHoras => [...prevHoras, formData.hora, siguienteHora]);
          
          // Actualizar la lista de horarios disponibles
          setHorariosDisponibles(prevHorarios => 
            prevHorarios.filter(h => h !== formData.hora && h !== siguienteHora)
          );
        } else {
          // Si no tiene duración extendida, solo bloquear la hora seleccionada
          setHorasOcupadas(prevHoras => [...prevHoras, formData.hora]);
          setHorariosDisponibles(prevHorarios => 
            prevHorarios.filter(h => h !== formData.hora)
          );
        }
        
        setFormData({
          paciente_rut: '',
          fecha: '',
          hora: '',
          tipo_tratamiento: '',
          tipo_cita: 'podologia',
          duracion_extendida: false
        });
        
        // Eliminar mensaje de carga
        document.body.removeChild(loadingMsg);
        
        // Mostrar mensaje de éxito
        mostrarNotificacion('Cita creada con éxito', 'success');
      } catch (apiError) {
        console.error('Error detallado al crear cita:', apiError);
        if (document.body.contains(loadingMsg)) {
          document.body.removeChild(loadingMsg);
        }
        mostrarNotificacion('Error al crear la cita', 'error');
      }
    } catch (error) {
      console.error('Error general al crear cita:', error);
      mostrarNotificacion('Error al crear la cita', 'error');
    }
  };

  // Función para mostrar notificaciones
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    const notificacion = document.createElement('div');
    notificacion.className = `fixed top-4 right-4 px-4 py-2 rounded-md z-50 ${
      tipo === 'error' ? 'bg-red-500' :
      tipo === 'success' ? 'bg-green-500' :
      'bg-blue-500'
    } text-white`;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 3000);
  };

  // Función para editar una cita
  const handleEditCita = (cita) => {
    // Normalizar el formato de hora (eliminar segundos si existen)
    let horaFormateada = cita.hora;
    if (horaFormateada && horaFormateada.includes(':')) {
      // Extraer solo horas y minutos (HH:MM)
      const partes = horaFormateada.split(':');
      if (partes.length >= 2) {
        horaFormateada = `${partes[0]}:${partes[1]}`;
      }
    }
    
    // Preparar datos para la edición
    setEditFormData({
      id: cita.id,
      paciente_rut: cita.paciente_rut,
      fecha: cita.fecha,
      hora: horaFormateada,
      tipo_tratamiento: cita.tipo_tratamiento || cita.tratamiento_nombre,
      estado: cita.estado,
      tipo_cita: cita.tipo_cita || 'podologia', // Asegurarnos de incluir el tipo de cita
      original_hora: horaFormateada, // Guardamos la hora original para referencia
      duracion_extendida: cita.duracion_extendida || false,
      original_duracion_extendida: cita.duracion_extendida || false // Guardar el estado original de duración extendida
    });
    
    // Cargar horarios disponibles para la fecha incluyendo la hora actual
    handleSelectSlotEdit({ 
      start: new Date(`${cita.fecha}T12:00:00`),
      citaId: cita.id,
      hora: horaFormateada
    });
    
    // Mostrar el modal de edición
    setShowEditModal(true);
  };

  // Función especial para cargar horarios en modo edición
  const handleSelectSlotEdit = async (slotInfo) => {
    console.log("Slot seleccionado para edición:", slotInfo);
    
    const start = new Date(slotInfo.start);
    setSelectedDate(start);
    
    // Formatear la fecha para la API
    const fechaFormateada = format(start, 'yyyy-MM-dd');
    
    try {
      // Generamos horarios fijos entre 9:00 y 18:00 como fallback
      const horariosGenerados = [];
      for (let hora = 9; hora <= 18; hora++) {
        horariosGenerados.push(`${hora.toString().padStart(2, '0')}:00`);
      }
      
      setHorariosDisponibles(horariosGenerados);
      
      // Luego intentamos obtener los horarios reales del backend
      try {
        const response = await axiosInstance.get(`/citas/disponibles/?fecha=${fechaFormateada}`);
        console.log("Respuesta de horarios para edición:", response.data);
        
        if (response.data && response.data.horas_disponibles) {
          // Incluir la hora original en los horarios disponibles para edición
          let horarios = response.data.horas_disponibles;
          
          // Normalizar horarios recibidos (eliminar segundos si existen)
          horarios = horarios.map(hora => {
            if (hora && hora.includes(':')) {
              const partes = hora.split(':');
              if (partes.length >= 2) {
                return `${partes[0]}:${partes[1]}`;
              }
            }
            return hora;
          });
          
          // Si hay una hora original que no está en la lista, la añadimos
          let horaOriginal = slotInfo.hora;
          if (horaOriginal && horaOriginal.includes(':')) {
            const partes = horaOriginal.split(':');
            if (partes.length >= 2) {
              horaOriginal = `${partes[0]}:${partes[1]}`;
            }
          }
          
          if (horaOriginal && !horarios.includes(horaOriginal)) {
            horarios.push(horaOriginal);
            // Ordenar los horarios
            horarios.sort();
          }
          
          setHorariosDisponibles(horarios);
          
          // También cargamos las horas ocupadas para mostrarlas como no disponibles
          try {
            const citasResponse = await citasService.getByFecha(fechaFormateada);
            console.log("Citas en la fecha seleccionada:", citasResponse.data);
            
            if (citasResponse.data && Array.isArray(citasResponse.data)) {
              // Inicializar array para todas las horas ocupadas
              let todasHorasOcupadas = [];
              
              // Filtrar las citas que no sean la que estamos editando
              citasResponse.data
                .filter(c => c.id !== slotInfo.citaId)
                .forEach(c => {
                  // Normalizar formato de hora
                  let hora = c.hora;
                  if (hora && hora.includes(':')) {
                    const partes = hora.split(':');
                    if (partes.length >= 2) {
                      hora = `${partes[0]}:${partes[1]}`;
                    }
                  }
                  
                  // Añadir la hora principal
                  todasHorasOcupadas.push(hora);
                  
                  // Si la cita tiene duración extendida, añadir la siguiente hora también
                  if (c.duracion_extendida) {
                    const [horaH, horaM] = hora.split(':').map(Number);
                    const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
                    todasHorasOcupadas.push(siguienteHora);
                  }
                });
                
              console.log("Horas ocupadas para edición (incluyendo extendidas):", todasHorasOcupadas);
              
              // Guardar las horas ocupadas en state pero preservar la hora original y permitir su selección
              setHorasOcupadas(todasHorasOcupadas);
            }
          } catch (error) {
            console.error("Error al cargar citas para la fecha:", error);
          }
        }
      } catch (apiError) {
        console.error('Error al obtener horarios desde la API para edición:', apiError);
      }
    } catch (error) {
      console.error('Error general al procesar la selección de fecha:', error);
      alert('Error al preparar el formulario de edición');
    }
  };

  // Función para actualizar una cita
  const handleUpdateCita = async (e) => {
    e.preventDefault();
    
    try {
      const notificacion = mostrarNotificacion('Actualizando cita...', 'info');
      
      console.log("Actualizando cita:", editFormData);
      
      // Verificar que el tipo_cita está presente
      if (!editFormData.tipo_cita) {
        console.warn("Tipo de cita no está presente, asignando 'podologia' por defecto");
        editFormData.tipo_cita = 'podologia';
      }
      
      // Verificar que la duración extendida esté definida
      if (editFormData.duracion_extendida === undefined) {
        console.warn("Duración extendida no está definida, asignando 'false' por defecto");
        editFormData.duracion_extendida = false;
      }
      
      // Verificar si hay conflictos con otras citas si se cambió la hora o se activó la duración extendida
      if (editFormData.duracion_extendida && 
          (editFormData.hora !== editFormData.original_hora || !editFormData.original_duracion_extendida)) {
        
        // Obtener la siguiente hora para verificar disponibilidad
        const [horaH, horaM] = editFormData.hora.split(':').map(Number);
        const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
        
        // Verificar si ya hay alguna cita en esa hora (que no sea la que estamos editando)
        const citaEnSiguienteHora = citas.find(cita => {
          // Omitir la cita actual que estamos editando
          if (cita.id === editFormData.id) return false;
          
          // Verificar si hay una cita en la misma fecha y hora siguiente
          return cita.fecha === editFormData.fecha && 
                 cita.hora === siguienteHora;
        });
        
        // Si hay una cita en la siguiente hora, no podemos extender la duración
        if (citaEnSiguienteHora) {
          if (document.body.contains(notificacion)) {
            document.body.removeChild(notificacion);
          }
          mostrarNotificacion(
            `No es posible extender la duración porque ya existe una cita a las ${siguienteHora} (${citaEnSiguienteHora.paciente_nombre})`, 
            'error'
          );
          return; // Detener la actualización
        }
      }
      
      // Hacer una copia de los datos para enviar al backend
      const datosCita = {
        ...editFormData,
        id: editFormData.id,
        paciente_rut: editFormData.paciente_rut,
        tipo_tratamiento: editFormData.tipo_tratamiento,
        fecha: editFormData.fecha,
        hora: editFormData.hora,
        estado: editFormData.estado,
        tipo_cita: editFormData.tipo_cita,
        duracion_extendida: editFormData.duracion_extendida
      };
      
      console.log("Datos enviados al API:", datosCita);
      
      // Hacer la petición de actualización
      const response = await citasService.update(editFormData.id, datosCita);
      console.log("Respuesta de actualización:", response.data);
      
      // Cerrar el modal y recargar los datos
      setShowEditModal(false);
      
      // Actualizar la información en la lista local de citas
      setCitas(prevCitas => prevCitas.map(cita => 
        cita.id === editFormData.id 
          ? { 
              ...cita, 
              ...editFormData,
              paciente_nombre: pacientes.find(p => p.rut === editFormData.paciente_rut)?.nombre || cita.paciente_nombre
            } 
          : cita
      ));
      
      // Actualizar datos completos
      await cargarDatos();
      
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
      
      mostrarNotificacion('Cita actualizada correctamente', 'success');
      
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      
      // Mostrar mensaje de error detallado
      let mensaje = 'Error al actualizar la cita';
      
      if (error.response) {
        console.log('Detalles del error de respuesta:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.status === 401) {
          mensaje = 'Error de autenticación. Por favor, refresca la página e intenta nuevamente.';
        } else if (error.response.status === 403) {
          mensaje = 'No tienes permiso para actualizar esta cita. Error de CSRF o autenticación.';
        } else if (error.response.status === 404) {
          mensaje = 'La cita que intentas actualizar no existe o ya fue eliminada.';
        } else if (error.response.status === 400) {
          mensaje = 'Datos inválidos. Verifica la información de la cita.';
          if (error.response.data && typeof error.response.data === 'object') {
            const errores = Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            mensaje += ` (${errores})`;
          }
        }
      }
      
      mostrarNotificacion(mensaje, 'error');
    }
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = (cita) => {
    setSelectedCita(cita);
    setShowDeleteConfirm(true);
  };

  // Función para eliminar una cita
  const handleDeleteCita = async () => {
    if (!selectedCita || !selectedCita.id) {
      mostrarNotificacion('No se ha seleccionado una cita para eliminar', 'error');
      return;
    }
    
    const notificacion = mostrarNotificacion('Eliminando cita...', 'info');
    
    try {
      console.log(`Intentando eliminar cita con ID: ${selectedCita.id}`);
      const response = await citasService.delete(selectedCita.id);
      console.log('Respuesta del servidor:', response);
      
      // Cerrar modal y recargar datos
      setShowDeleteConfirm(false);
      await cargarDatos();
      
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
      
      mostrarNotificacion('Cita eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      
      // Mostrar mensaje de error detallado
      let mensaje = 'Error al eliminar la cita';
      
      if (error.response) {
        console.log('Detalles del error de respuesta:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.status === 403) {
          mensaje = 'No tienes permiso para eliminar esta cita. Error de CSRF o autenticación.';
        } else if (error.response.status === 404) {
          mensaje = 'La cita que intentas eliminar no existe o ya fue eliminada.';
        } else if (error.response.data) {
          if (error.response.data.error) {
            mensaje = error.response.data.error;
          } else if (typeof error.response.data === 'string') {
            mensaje = error.response.data;
          } else if (error.response.data.detail) {
            mensaje = error.response.data.detail;
          }
        }
      }
      
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
      
      mostrarNotificacion(mensaje, 'error');
    }
  };

  // Agregar la función handleChangeTipoCita
  const handleChangeTipoCita = (e) => {
    setFormData({
      ...formData,
      tipo_cita: e.target.value,
      tipo_tratamiento: '' // Resetear el tratamiento al cambiar el tipo de cita
    });
  };

  // Agregar función para manejar cambio en duración extendida
  const handleDuracionExtendidaChange = (e) => {
    const nuevaDuracionExtendida = e.target.checked;
    
    // Si se desactiva el checkbox, simplemente actualizar el estado
    if (!nuevaDuracionExtendida) {
      setFormData({
        ...formData,
        duracion_extendida: nuevaDuracionExtendida
      });
      return;
    }
    
    // Si se activa el checkbox, hay que verificar varias condiciones
    if (nuevaDuracionExtendida && formData.hora) {
      // 1. Obtener la siguiente hora para verificar disponibilidad
      const [horaH, horaM] = formData.hora.split(':').map(Number);
      const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
      
      // 2. Verificar si ya hay alguna cita en esa hora
      const citaEnSiguienteHora = citas.find(cita => 
        cita.fecha === formData.fecha && cita.hora === siguienteHora
      );
      
      // Si hay una cita en la siguiente hora, no podemos extender la duración
      if (citaEnSiguienteHora) {
        mostrarNotificacion(
          `No es posible extender la duración porque ya existe una cita a las ${siguienteHora} (${citaEnSiguienteHora.paciente_nombre})`, 
          'warning'
        );
        return;
      }
      
      // 3. Verificar si la siguiente hora está dentro de los horarios disponibles
      const siguienteHoraDisponible = horariosDisponibles.includes(siguienteHora);
      
      if (!siguienteHoraDisponible) {
        mostrarNotificacion(
          `La hora siguiente (${siguienteHora}) no está disponible para reservar 2 horas`, 
          'warning'
        );
        return;
      }
    }
    
    // Si pasó todas las validaciones, actualizar el estado
    setFormData({
      ...formData,
      duracion_extendida: nuevaDuracionExtendida
    });
  };

  // Función para manejar cambio en duración extendida en el formulario de edición
  const handleEditDuracionExtendidaChange = (e) => {
    const nuevaDuracionExtendida = e.target.checked;
    
    // Si se desactiva el checkbox, simplemente actualizar el estado
    if (!nuevaDuracionExtendida) {
      setEditFormData({
        ...editFormData,
        duracion_extendida: nuevaDuracionExtendida
      });
      return;
    }
    
    // Si se activa el checkbox, hay que verificar varias condiciones
    if (nuevaDuracionExtendida && editFormData.hora) {
      // 1. Obtener la siguiente hora para verificar disponibilidad
      const [horaH, horaM] = editFormData.hora.split(':').map(Number);
      const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
      
      // 2. Verificar si ya hay alguna cita en esa hora (que no sea la que estamos editando)
      const citaEnSiguienteHora = citas.find(cita => {
        // Omitir la cita actual que estamos editando
        if (cita.id === editFormData.id) return false;
        
        // Verificar si hay una cita en la misma fecha y hora siguiente
        return cita.fecha === editFormData.fecha && 
               cita.hora === siguienteHora;
      });
      
      // Si hay una cita en la siguiente hora, no podemos extender la duración
      if (citaEnSiguienteHora) {
        mostrarNotificacion(
          `No es posible extender la duración porque ya existe una cita a las ${siguienteHora} (${citaEnSiguienteHora.paciente_nombre})`, 
          'warning'
        );
        return;
      }
      
      // 3. Verificar si la siguiente hora está dentro de los horarios disponibles o es la hora original
      const siguienteHoraDisponible = horariosDisponibles.includes(siguienteHora) || 
                                      siguienteHora === editFormData.original_hora ||
                                      // También considerar el caso donde la duración ya era extendida
                                      (editFormData.original_duracion_extendida && 
                                       siguienteHora === `${(parseInt(editFormData.original_hora.split(':')[0]) + 1).toString().padStart(2, '0')}:${editFormData.original_hora.split(':')[1]}`);
      
      if (!siguienteHoraDisponible && siguienteHora !== editFormData.original_hora) {
        mostrarNotificacion(
          `La hora siguiente (${siguienteHora}) no está disponible para reservar 2 horas`, 
          'warning'
        );
        return;
      }
    }
    
    // Si pasó todas las validaciones, actualizar el estado
    setEditFormData({
      ...editFormData,
      duracion_extendida: nuevaDuracionExtendida
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  // Depurar antes de crear eventos
  console.log('Preparando eventos con citas:', citas);
  
  // Eventos para el calendario
  const eventos = Array.isArray(citas) ? citas.map(cita => {
    try {
      // Verificar datos críticos
      if (!cita.fecha || !cita.hora) {
        console.error('Cita sin fecha u hora:', cita);
        return null;
      }
      
      // Prevenir errores de formato
      const fechaStr = typeof cita.fecha === 'string' ? cita.fecha : cita.fecha.toString();
      const horaStr = typeof cita.hora === 'string' ? cita.hora : cita.hora.toString();
      
      // Construir fechas correctamente
      const fechaHora = `${fechaStr}T${horaStr}`;
      console.log('Creando evento con fecha/hora:', fechaHora);
      
      // Determinar el color según el tipo de cita
      let backgroundColor = '#3788d8'; // color por defecto
      
      if (cita.tipo_cita === 'manicura') {
        backgroundColor = '#ec4899'; // Color rosa para manicura (pink-500 en tailwind)
        console.log('Asignando color ROSA para cita de manicura:', cita.id);
      } else {
        // Para citas podológicas, siempre usar azul
        backgroundColor = '#3b82f6'; // Azul (blue-500 en tailwind)
        console.log('Asignando color AZUL para cita de podología:', cita.id);
      }
      
      const evento = {
        id: cita.id,
        title: `${cita.paciente_nombre || 'Sin nombre'} - ${cita.tipo_tratamiento || cita.tratamiento_nombre || 'Sin tratamiento'}${cita.duracion_extendida ? ' (2h)' : ''}`,
        start: new Date(fechaHora),
        end: new Date(new Date(fechaHora).getTime() + (cita.duracion_extendida ? 120 : 60) * 60000), // Duración de 2 horas si es extendida, 1 hora por defecto
        resource: cita, // Almacenar la cita completa como recurso para acceder a ella después
        backgroundColor: backgroundColor, // Añadir el color al evento
      };
      
      // Verificar que las fechas se crearon correctamente
      if (isNaN(evento.start.getTime()) || isNaN(evento.end.getTime())) {
        console.error('Error: Fecha inválida para el evento', { cita, fechaHora });
        return null;
      }
      
      return evento;
    } catch (error) {
      console.error('Error al procesar cita:', error, cita);
      return null;
    }
  }).filter(evento => evento !== null) : []; // Eliminar eventos nulos y manejar el caso cuando citas no es un array
  
  console.log('Eventos para el calendario:', eventos);

  // Añadir un eventPropGetter para el calendario
  const eventPropGetter = (event) => {
    // Aplicar corrección para citas específicas por ID
    if (event.id === 11 || event.id === 13) {
      console.log(`Forzando color ROSA para cita ID ${event.id} (manicura)`);
      return {
        style: {
          backgroundColor: '#ec4899', // Color rosa para manicura
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block',
        }
      };
    }
    
    // Si el título contiene "Manicura", usar color rosa
    if (event.title && event.title.includes("Manicura")) {
      console.log(`Aplicando color ROSA por título para cita "${event.title}"`);
      return {
        style: {
          backgroundColor: '#ec4899', // Color rosa para manicura
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block',
        }
      };
    }
    
    // Usar el color asignado en el evento o el color por defecto
    return {
      style: {
        backgroundColor: event.backgroundColor || '#3b82f6', // Color por defecto si no hay otro asignado
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      }
    };
  };

  // Ordenar citas por fecha y hora para la vista de agenda
  const citasOrdenadas = Array.isArray(citas) ? [...citas].sort((a, b) => {
    try {
      // Primero ordenar por fecha
      const fechaA = new Date(`${a.fecha}T${a.hora}`);
      const fechaB = new Date(`${b.fecha}T${b.hora}`);
      
      // Verificar si las fechas son válidas
      if (isNaN(fechaA.getTime())) {
        console.warn('Fecha inválida:', a);
        return 1; // Colocar elementos con fechas inválidas al final
      }
      if (isNaN(fechaB.getTime())) {
        console.warn('Fecha inválida:', b);
        return -1;
      }
      
      return fechaA - fechaB;
    } catch (error) {
      console.error('Error al ordenar citas:', error);
      return 0;
    }
  }) : [];

  // Componente para mostrar cuando no hay citas
  const NoCitas = () => (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            No hay citas registradas. Use el botón "Verificar Citas" para depurar problemas o cree una nueva cita con el botón "Nueva Cita".
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Calendario de Citas</h1>
        </div>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'agenda' ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setCurrentView('agenda')}
          >
            Ver Agenda
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            onClick={() => {
              setSelectedDate(new Date());
              setFormData(prev => ({ ...prev, fecha: format(new Date(), 'yyyy-MM-dd') }));
              handleSelectSlot({ start: new Date() });
            }}
          >
            + Nueva Cita
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={true}
          className="calendar-hover-pointer"
          view={currentView}
          onView={handleViewChange}
          views={['month', 'week', 'day', 'agenda']}
          culture="es"
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
            dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
            dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
          }}
          eventPropGetter={eventPropGetter}
        />
      </div>

      {/* Lista de citas alternativa (visible cuando se selecciona la vista "agenda") */}
      {currentView === 'agenda' && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Listado de Citas</h2>
          {citasOrdenadas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tratamiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {citasOrdenadas.map((cita) => {
                    // Validar fecha y hora
                    let fechaFormateada = 'Fecha inválida';
                    let horaFormateada = 'Hora inválida';
                    let fechaValida = true;
                    
                    try {
                      // Formatear fecha y hora para mostrar
                      const fechaHora = `${cita.fecha}T${cita.hora}`;
                      const fechaObj = new Date(fechaHora);
                      
                      if (!isNaN(fechaObj.getTime())) {
                        fechaFormateada = formatDate(fechaObj, 'dd/MM/yyyy');
                        horaFormateada = formatDate(fechaObj, 'HH:mm');
                      } else {
                        fechaValida = false;
                        console.warn('Fecha/hora inválida para cita:', cita);
                      }
                    } catch (error) {
                      fechaValida = false;
                      console.error('Error al formatear fecha/hora:', error, cita);
                    }
                    
                    // Definir clase según el estado
                    let estadoClase = "bg-blue-100 text-blue-800"; // Por defecto (reservada)
                    if (cita.estado === 'confirmada') estadoClase = "bg-green-100 text-green-800";
                    else if (cita.estado === 'completada') estadoClase = "bg-green-100 text-green-800";
                    else if (cita.estado === 'cancelada') estadoClase = "bg-red-100 text-red-800";

                    // Si la fecha es inválida, mostrar una fila de error
                    if (!fechaValida) {
                      return (
                        <tr key={cita.id} className="bg-red-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="text-sm text-red-600">
                              Cita con formato inválido (ID: {cita.id}) - Fecha: {cita.fecha}, Hora: {cita.hora}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={cita.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{fechaFormateada}</div>
                          <div className="text-sm text-gray-500">{horaFormateada}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cita.paciente_nombre || 'Sin nombre'}</div>
                          <div className="text-sm text-gray-500">{cita.paciente_rut || 'Sin RUT'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cita.tipo_tratamiento || cita.tratamiento_nombre || 'No especificado'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClase}`}>
                            {cita.estado ? (cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)) : 'Desconocido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedCita(cita);
                              setShowDetailModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditCita(cita)}
                            className="text-amber-600 hover:text-amber-900 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(cita)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <NoCitas />
          )}
        </div>
      )}

      {/* Modal para formulario de nueva cita */}
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

                <div className="mb-4 p-3 border border-indigo-200 rounded-md bg-indigo-50">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="duracion_extendida"
                        name="duracion_extendida"
                        type="checkbox"
                        checked={formData.duracion_extendida || false}
                        onChange={handleDuracionExtendidaChange}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="duracion_extendida" className="font-bold text-indigo-700">
                        Reservar 2 horas
                      </label>
                      <p className="text-indigo-600">Marque esta opción si la atención requiere tiempo extendido</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                  <div className="horarios-grid">
                    {horariosDisponibles.length > 0 ? (
                      horariosDisponibles.map(hora => {
                        // Comprobar si esta hora estaría bloqueada por una cita de 2 horas previa
                        const esBloqueadaPorExtendida = horasOcupadas.some(horaOcupada => {
                          // Convertir a números para comparar
                          const [horaOcupadaH, horaOcupadaM] = horaOcupada.split(':').map(Number);
                          const [horaActualH, horaActualM] = hora.split(':').map(Number);
                          
                          // Verificar si la hora actual es 1 hora después de una hora ocupada
                          // (lo que significa que esa hora ocupada tiene duración extendida)
                          if (horaOcupadaH === horaActualH - 1 && horaOcupadaM === horaActualM) {
                            // Buscar la cita que corresponde a esa hora para ver si tiene duración extendida
                            const citaExtendida = citas.find(c => {
                              // Normalizar formato hora
                              let horaC = c.hora;
                              if (horaC && horaC.includes(':')) {
                                const partes = horaC.split(':');
                                if (partes.length >= 2) {
                                  horaC = `${partes[0]}:${partes[1]}`;
                                }
                              }
                              return horaC === horaOcupada && c.duracion_extendida;
                            });
                            return !!citaExtendida;
                          }
                          return false;
                        });
                        
                        // Determinar si la siguiente hora está disponible (para cuando se selecciona duración extendida)
                        const [horaH, horaM] = hora.split(':').map(Number);
                        const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
                        const siguienteHoraDisponible = horariosDisponibles.includes(siguienteHora);
                        
                        const isOcupada = (horasOcupadas.includes(hora) && !esBloqueadaPorExtendida) || esBloqueadaPorExtendida;
                        const noPermiteDuracionExtendida = formData.duracion_extendida && !siguienteHoraDisponible;
                        
                        // Determinar si está deshabilitada
                        const isDisabled = isOcupada || noPermiteDuracionExtendida;
                        
                        // Si la hora está deshabilitada, no la mostramos
                        if (isDisabled) return null;
                        
                        // Clases CSS dinámicas
                        let btnClass = "horario-btn ";
                        if (formData.hora === hora) {
                          btnClass += "selected ";
                        } else {
                          btnClass += "bg-gray-100 ";
                        }

                        // Si la hora está seleccionada y se cambia a duración extendida, verificar
                        // si debemos desmarcarla porque la siguiente hora no está disponible
                        if (formData.hora === hora && formData.duracion_extendida && !siguienteHoraDisponible) {
                          // Desmarcar la selección ya que no es válida con duración extendida
                          setTimeout(() => {
                            setFormData(prev => ({ ...prev, hora: '' }));
                          }, 100);
                        }
                        
                        return (
                          <button
                            key={hora}
                            type="button"
                            className={btnClass}
                            onClick={() => {
                              setFormData({ ...formData, hora });
                            }}
                            title="Hora disponible"
                          >
                            {hora}
                          </button>
                        );
                      }).filter(button => button !== null) // Filtrar los null (horas deshabilitadas)
                    ) : (
                      <p className="text-indigo-500 text-sm">Cargando horarios disponibles...</p>
                    )}
                  </div>
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

      {/* Modal para editar cita */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Cita - ID: {editFormData.id}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCita}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cita</label>
                  <select
                    value={editFormData.tipo_cita || 'podologia'}
                    onChange={(e) => setEditFormData({ 
                      ...editFormData, 
                      tipo_cita: e.target.value,
                      tipo_tratamiento: '' // Resetear el tratamiento al cambiar el tipo
                    })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (yyyy-mm-dd)</label>
                  <input
                    type="date"
                    value={editFormData.fecha}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                    required
                  />
                </div>

                <div className="mb-4 p-3 border border-indigo-200 rounded-md bg-indigo-50">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="edit_duracion_extendida"
                        name="duracion_extendida"
                        type="checkbox"
                        checked={editFormData.duracion_extendida || false}
                        onChange={handleEditDuracionExtendidaChange}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="edit_duracion_extendida" className="font-bold text-indigo-700">
                        Reservar 2 horas
                      </label>
                      <p className="text-indigo-600">Marque esta opción si la atención requiere tiempo extendido</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                  <div className="horarios-grid">
                    {/* Incluir la hora original en los horarios disponibles */}
                    {[...new Set([...horariosDisponibles, editFormData.original_hora])].sort().map(hora => {
                      // Normalizar el formato de la hora (para comparación)
                      let horaFormateada = hora;
                      if (horaFormateada && horaFormateada.includes(':')) {
                        const partes = horaFormateada.split(':');
                        if (partes.length >= 2) {
                          horaFormateada = `${partes[0]}:${partes[1]}`;
                        }
                      }
                      
                      // Determinar el estado del botón de hora
                      const isOriginalHora = horaFormateada === editFormData.original_hora;
                      const isSelected = horaFormateada === editFormData.hora;
                      
                      // Verificar si la hora está bloqueada por otra cita con duración extendida
                      const esBloqueadaPorExtendida = horasOcupadas.some(horaOcupada => {
                        if (horaOcupada === editFormData.original_hora) return false; // No bloquear por la propia cita
                        
                        // Convertir a números para comparar
                        const [horaOcupadaH, horaOcupadaM] = horaOcupada.split(':').map(Number);
                        const [horaActualH, horaActualM] = horaFormateada.split(':').map(Number);
                        
                        // Verificar si la hora actual es 1 hora después de una hora ocupada
                        if (horaOcupadaH === horaActualH - 1 && horaOcupadaM === horaActualM) {
                          // Buscar la cita que corresponde a esa hora para ver si tiene duración extendida
                          const citaExtendida = citas.find(c => {
                            let horaC = c.hora;
                            if (horaC && horaC.includes(':')) {
                              const partes = horaC.split(':');
                              if (partes.length >= 2) {
                                horaC = `${partes[0]}:${partes[1]}`;
                              }
                            }
                            return horaC === horaOcupada && c.duracion_extendida && c.id !== editFormData.id;
                          });
                          return !!citaExtendida;
                        }
                        return false;
                      });
                      
                      // Verificar si la siguiente hora está disponible (para cuando se selecciona duración extendida)
                      const [horaH, horaM] = horaFormateada.split(':').map(Number);
                      const siguienteHora = `${(horaH + 1).toString().padStart(2, '0')}:${horaM.toString().padStart(2, '0')}`;
                      const siguienteHoraDisponible = horariosDisponibles.includes(siguienteHora) || 
                                                      siguienteHora === editFormData.original_hora;
                      
                      const isOcupada = (horasOcupadas.includes(horaFormateada) && !isOriginalHora) || esBloqueadaPorExtendida;
                      const noPermiteDuracionExtendida = editFormData.duracion_extendida && !siguienteHoraDisponible && !isOriginalHora;
                      
                      // Determinar si está deshabilitada
                      const isDisabled = isOcupada || noPermiteDuracionExtendida;
                      
                      // Si la hora está deshabilitada y no es la hora original, no la mostramos
                      if (isDisabled && !isOriginalHora) return null;
                      
                      // Clases CSS dinámicas
                      let btnClass = "horario-btn ";
                      if (isSelected) {
                        btnClass += "selected ";
                      } else if (isOriginalHora && !isSelected) {
                        btnClass += "original ";
                      } else {
                        btnClass += "bg-gray-100 ";
                      }
                      
                      if (isOriginalHora && !isSelected) {
                        btnClass += "original ";
                      }
                      
                      // Si la hora está seleccionada y se cambia a duración extendida, verificar
                      // si debemos desmarcarla porque la siguiente hora no está disponible
                      if (editFormData.hora === horaFormateada && 
                          editFormData.duracion_extendida && 
                          !siguienteHoraDisponible && 
                          horaFormateada !== editFormData.original_hora) {
                        // Desmarcar la selección ya que no es válida con duración extendida
                        setTimeout(() => {
                          setEditFormData(prev => ({ ...prev, hora: '' }));
                        }, 100);
                      }
                      
                      return (
                        <button
                          key={horaFormateada}
                          type="button"
                          className={btnClass}
                          onClick={() => {
                            setEditFormData({ ...editFormData, hora: horaFormateada });
                          }}
                          title={
                            isOriginalHora ? "Hora original de la cita" : 
                            "Hora disponible"
                          }
                        >
                          {/* Mostrar solo el formato HH:MM (sin segundos) */}
                          {horaFormateada}
                          {isOriginalHora && !isSelected && (
                            <span className="original-indicator">♦</span>
                          )}
                        </button>
                      );
                    }).filter(button => button !== null) // Filtrar los null (horas deshabilitadas)
                    }
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                  onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                  disabled={!editFormData.hora || !editFormData.paciente_rut || !editFormData.tipo_tratamiento}
                  >
                  Actualizar
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar cita */}
      {showDeleteConfirm && selectedCita && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Confirmar Eliminación
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    ¿Está seguro que desea eliminar esta cita? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Detalles de la Cita</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">Paciente:</div>
                <div className="text-sm text-gray-900">{selectedCita.paciente_nombre || 'No disponible'}</div>
                
                <div className="text-sm font-medium text-gray-500">Fecha:</div>
                <div className="text-sm text-gray-900">
                  {formatDate(new Date(`${selectedCita.fecha}T${selectedCita.hora}`), 'dd/MM/yyyy')}
                </div>
                
                <div className="text-sm font-medium text-gray-500">Hora:</div>
                <div className="text-sm text-gray-900">{selectedCita.hora}</div>
                
                <div className="text-sm font-medium text-gray-500">Tratamiento:</div>
                <div className="text-sm text-gray-900">
                  {selectedCita.tipo_tratamiento || selectedCita.tratamiento_nombre || 'No especificado'}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCita}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para detalles de la cita */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles de la Cita
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDetailModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Información de la Cita</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">Fecha:</div>
                <div className="text-sm text-gray-900">{formatDate(new Date(`${selectedCita.fecha}T${selectedCita.hora}`), 'dd/MM/yyyy')}</div>
                
                <div className="text-sm font-medium text-gray-500">Hora:</div>
                <div className="text-sm text-gray-900">{selectedCita.hora}</div>
                
                <div className="text-sm font-medium text-gray-500">Estado:</div>
                <div className="text-sm text-gray-900">{selectedCita.estado}</div>
                
                <div className="text-sm font-medium text-gray-500">Tratamiento:</div>
                <div className="text-sm text-gray-900">{selectedCita.tipo_tratamiento || selectedCita.tratamiento_nombre || 'No especificado'}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Paciente</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">Nombre:</div>
                <div className="text-sm text-gray-900">{selectedCita.paciente_nombre || 'No disponible'}</div>
                
                <div className="text-sm font-medium text-gray-500">RUT:</div>
                <div className="text-sm text-gray-900">{selectedCita.paciente_rut || 'No disponible'}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleEditCita(selectedCita);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteConfirm(selectedCita);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCitasPage; 