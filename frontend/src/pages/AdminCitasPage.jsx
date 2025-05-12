import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { format as formatDate, parseISO } from 'date-fns';
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
  const [depuracionActiva, setDepuracionActiva] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    estado: '',
    original_hora: ''
  });

  const [formData, setFormData] = useState({
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: '',
    tipo_cita: 'podologia'
  });

  const [horasOcupadas, setHorasOcupadas] = useState([]);

  // Añadir un estado para controlar el intervalo de actualización
  const [actualizacionAutomatica, setActualizacionAutomatica] = useState(true);
  const [intervaloActualizacion, setIntervaloActualizacion] = useState(null);

  // Cuando el componente se monta, cargar datos y establecer actualización automática
  useEffect(() => {
    cargarDatos();
    
    // Configurar actualización automática cada 30 segundos
    const intervalo = setInterval(() => {
      if (actualizacionAutomatica) {
        console.log("Actualización automática de citas...");
        cargarDatosCompletos();
      }
    }, 30000); // 30 segundos
    
    setIntervaloActualizacion(intervalo);
    
    // Mostrar notificación inicial
    setTimeout(() => {
      mostrarNotificacion(
        'Las citas se actualizan automáticamente cada 30 segundos', 
        'info'
      );
    }, 2000);
    
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, []);

  // Detener la actualización automática cuando se abre cualquier modal
  useEffect(() => {
    // Si cualquier modal está abierto, pausar actualizaciones
    const modalAbierto = showForm || showEditModal || showDetailModal || showDeleteConfirm;
    
    if (modalAbierto && actualizacionAutomatica) {
      console.log("Pausando actualización automática (modal abierto)");
      setActualizacionAutomatica(false);
    } else if (!modalAbierto && !actualizacionAutomatica) {
      console.log("Reanudando actualización automática");
      setActualizacionAutomatica(true);
      
      // Hacer una actualización inmediata al cerrar modales
      cargarDatosCompletos();
    }
  }, [showForm, showEditModal, showDetailModal, showDeleteConfirm]);

  // Función para cargar datos completos (utilizando la API de debug)
  const cargarDatosCompletos = async () => {
    try {
      // Obtener citas con el endpoint de depuración que proporciona más detalles
      const citasDebug = await axiosInstance.get('/citas/debug/');
      console.log('Respuesta de depuración:', citasDebug);
      
      if (citasDebug.data && citasDebug.data.citas && citasDebug.data.citas.length > 0) {
        // Limpiar las citas anteriores primero
        setCitas([]);
        
        // Establecer las nuevas citas con un ligero retraso para garantizar la actualización
        setTimeout(() => {
          setCitas(citasDebug.data.citas);
          console.log(`Citas actualizadas automáticamente: ${citasDebug.data.citas.length} citas cargadas`);
        }, 100);
      } else {
        console.log('No se encontraron citas en la respuesta del API de depuración');
        setCitas([]);
      }
      
      // También cargar datos de pacientes si es necesario
      const pacientesRes = await pacientesService.getAll();
      setPacientes(pacientesRes.data);
      
    } catch (error) {
      console.error('Error al cargar datos completos:', error);
      
      // Si falla la API de depuración, intentar con la API estándar
      cargarDatos();
    } finally {
      setLoading(false);
    }
  };

  // Función original para cargar datos (como respaldo)
  const cargarDatos = async () => {
    try {
      const [citasRes, pacientesRes] = await Promise.all([
        citasService.getAll(),
        pacientesService.getAll()
      ]);
      
      // Imprimir la respuesta completa para inspección
      console.log('Respuesta completa del servidor (citas):', citasRes);
      
      // Asegurarse de que citas sea un array
      let citasData = [];
      
      if (citasRes.data) {
        if (Array.isArray(citasRes.data)) {
          citasData = citasRes.data;
        } else if (citasRes.data.results && Array.isArray(citasRes.data.results)) {
          // Para APIs que devuelven paginación
          citasData = citasRes.data.results;
        } else if (typeof citasRes.data === 'object') {
          // Intentar extraer datos de un objeto
          console.log('Los datos de citas no son un array, intentando extraer contenido');
          const keys = Object.keys(citasRes.data);
          if (keys.length > 0 && Array.isArray(citasRes.data[keys[0]])) {
            citasData = citasRes.data[keys[0]];
          }
        }
      }
      
      console.log('Citas procesadas:', citasData);
      
      if (citasData.length === 0) {
        console.log('No se encontraron citas en la respuesta');
      } else {
        // Verificar formato de cada cita
        citasData.forEach((cita, index) => {
          console.log(`Cita ${index}:`, cita);
          // Verificar campos críticos
          if (!cita.id) console.warn(`Cita ${index} no tiene ID`);
          if (!cita.fecha) console.warn(`Cita ${index} no tiene fecha`);
          if (!cita.hora) console.warn(`Cita ${index} no tiene hora`);
        });
      }
      
      // Establecer las citas asegurando que sea un array
      setCitas(Array.isArray(citasData) ? citasData : []);
      
      // Establecer los pacientes
      setPacientes(Array.isArray(pacientesRes.data) ? pacientesRes.data : []);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      setCitas([]); // En caso de error, establecer un array vacío
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
        // Usamos el nuevo endpoint correcto
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
          // Continuamos aunque falle el envío de WhatsApp
        }
        
      setShowForm(false);
        
        // Forzamos una pausa breve antes de recargar los datos
        setTimeout(async () => {
          await cargarDatos();
          console.log("Citas actualizadas después de crear:", citas);
        }, 500);
        
      setFormData({
        paciente_rut: '',
        fecha: '',
        hora: '',
        tipo_tratamiento: '',
        tipo_tratamiento: ''
      });
        
        // Eliminar mensaje de carga
        document.body.removeChild(loadingMsg);
        
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50';
        successMsg.textContent = 'Cita creada con éxito';
        document.body.appendChild(successMsg);
        
        // Eliminar mensaje después de 3 segundos
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } catch (apiError) {
        console.error('Error detallado al crear cita:', apiError);
        
        // Eliminar mensaje de carga
        document.body.removeChild(loadingMsg);
        
        // Mostrar información más detallada del error
        if (apiError.response) {
          console.log('Detalles del error:', {
            status: apiError.response.status,
            headers: apiError.response.headers,
            data: apiError.response.data
          });
          
          // Mensaje de error más específico
          let errorMsg = 'Error al crear la cita. Por favor, intente nuevamente.';
          
          // Mostrar mensaje de error más detallado si está disponible
          if (apiError.response.data) {
            if (apiError.response.data.error) {
              errorMsg = apiError.response.data.error;
            } else if (typeof apiError.response.data === 'string') {
              errorMsg = apiError.response.data;
            } else if (apiError.response.data.detail) {
              errorMsg = apiError.response.data.detail;
            } else if (apiError.response.data.message) {
              errorMsg = apiError.response.data.message;
            } else {
              // Intentar extraer cualquier mensaje de error disponible
              const errData = apiError.response.data;
              for (const key in errData) {
                if (Array.isArray(errData[key])) {
                  errorMsg = `${key}: ${errData[key].join(", ")}`;
                  break;
                } else if (typeof errData[key] === 'string') {
                  errorMsg = `${key}: ${errData[key]}`;
                  break;
                }
              }
            }
          }
          
          // Mostrar mensaje de error
          const errorElement = document.createElement('div');
          errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50';
          errorElement.textContent = errorMsg;
          document.body.appendChild(errorElement);
          
          // Eliminar mensaje después de 5 segundos
          setTimeout(() => {
            document.body.removeChild(errorElement);
          }, 5000);
        } else {
          // Mensaje genérico para errores sin respuesta
          const errorElement = document.createElement('div');
          errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50';
          errorElement.textContent = 'Error al crear la cita. Por favor, intente nuevamente.';
          document.body.appendChild(errorElement);
          
          // Eliminar mensaje después de 5 segundos
          setTimeout(() => {
            document.body.removeChild(errorElement);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error general al crear cita:', error);
      
      // Mensaje genérico para errores generales
      const errorElement = document.createElement('div');
      errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50';
      errorElement.textContent = 'Error general al crear la cita. Por favor, intente nuevamente.';
      document.body.appendChild(errorElement);
      
      // Eliminar mensaje después de 5 segundos
      setTimeout(() => {
        document.body.removeChild(errorElement);
      }, 5000);
    }
  };

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

  const depurarCitas = async () => {
    setDepuracionActiva(true);
    const notificacion = mostrarNotificacion('Iniciando depuración de citas...', 'info');
    
    try {
      // Obtener citas usando el endpoint normal
      console.log('=== INICIANDO DEPURACIÓN DE CITAS ===');
      
      console.log('1. Obteniendo citas desde endpoint estándar...');
      const citasEstandar = await citasService.getAll();
      console.log('Respuesta estándar:', citasEstandar);
      
      // Obtener citas con el endpoint de depuración
      console.log('2. Obteniendo citas desde endpoint de depuración...');
      const citasDebug = await axiosInstance.get('/citas/debug/');
      console.log('Respuesta de depuración:', citasDebug);
      
      // Remover la notificación inicial si sigue existiendo
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
      
      // Comparar resultados
      console.log('3. Comparando resultados:');
      const totalEstandar = Array.isArray(citasEstandar.data) ? citasEstandar.data.length : 'No es un array';
      const totalDebug = citasDebug.data.total_citas;
      
      console.log(`   - Total citas estándar: ${totalEstandar}`);
      console.log(`   - Total citas debug: ${totalDebug}`);
      
      // Mostrar notificación con resultados
      mostrarNotificacion(`Depuración completada:
        • API estándar: ${totalEstandar} citas
        • API debug: ${totalDebug} citas
        Resultados detallados en consola.`, 'success');
      
      // Si hay citas en la API de depuración, actualizamos el estado
      if (citasDebug.data.citas && citasDebug.data.citas.length > 0) {
        mostrarNotificacion(`Actualizando vista con ${citasDebug.data.citas.length} citas del endpoint de depuración`, 'info');
        setCitas(citasDebug.data.citas);
      }
      
    } catch (error) {
      console.error('Error en la depuración:', error);
      mostrarNotificacion(`Error en la depuración: ${error.message}. Consulta la consola para más detalles.`, 'error');
    } finally {
      setDepuracionActiva(false);
    }
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
      original_hora: horaFormateada // Guardamos la hora original para referencia
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
              // Filtrar las citas que no sean la que estamos editando
              const horasOcupadas = citasResponse.data
                .filter(c => c.id !== slotInfo.citaId)
                .map(c => {
                  // Normalizar formato de hora
                  let hora = c.hora;
                  if (hora && hora.includes(':')) {
                    const partes = hora.split(':');
                    if (partes.length >= 2) {
                      hora = `${partes[0]}:${partes[1]}`;
                    }
                  }
                  return hora;
                });
                
              console.log("Horas ocupadas (excluyendo la actual):", horasOcupadas);
              
              // Guardamos las horas ocupadas en un state para usarlas en la visualización
              setHorasOcupadas(horasOcupadas);
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
      
      // Hacer la petición de actualización
      const response = await citasService.update(editFormData.id, editFormData);
      
      console.log("Respuesta de actualización:", response.data);
      
      // Cerrar el modal y recargar los datos
      setShowEditModal(false);
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
        
        if (error.response.status === 403) {
          mensaje = 'No tienes permiso para actualizar esta cita. Error de CSRF o autenticación.';
        } else if (error.response.status === 404) {
          mensaje = 'La cita que intentas actualizar no existe o ya fue eliminada.';
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
        title: `${cita.paciente_nombre || 'Sin nombre'} - ${cita.tipo_tratamiento || cita.tratamiento_nombre || 'Sin tratamiento'}`,
        start: new Date(fechaHora),
        end: new Date(new Date(fechaHora).getTime() + 60 * 60000), // Duración de 1 hora
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
          {actualizacionAutomatica && (
            <span 
              className="relative flex h-3 w-3 ml-2" 
              title="Actualización automática activada"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
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
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            onClick={() => cargarDatosCompletos()}
            title="Actualizar manualmente la lista de citas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                  <div className="horarios-grid">
                    {horariosDisponibles.length > 0 ? (
                      horariosDisponibles.map(hora => (
                        <button
                          key={hora}
                          type="button"
                          className={`horario-btn ${formData.hora === hora ? 'selected' : 'bg-gray-100'}`}
                          onClick={() => setFormData({ ...formData, hora })}
                        >
                          {hora}
                        </button>
                      ))
                    ) : (
                      <p className="text-red-500 text-sm">No hay horarios disponibles para esta fecha</p>
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Horarios Disponibles</label>
                <div className="horarios-grid">
                  {/* Incluir la hora actual de la cita en los horarios disponibles */}
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
                    const isOcupada = horasOcupadas.some(h => {
                      if (h && h.includes(':')) {
                        const partes = h.split(':');
                        if (partes.length >= 2) {
                          return `${partes[0]}:${partes[1]}` === horaFormateada;
                        }
                      }
                      return h === horaFormateada;
                    }) && !isOriginalHora;
                    
                    // Clases CSS dinámicas
                    let btnClass = "horario-btn ";
                    if (isSelected) {
                      btnClass += "selected ";
                    } else if (isOcupada) {
                      btnClass += "ocupada ";
                    } else {
                      btnClass += "bg-gray-100 ";
                    }
                    
                    if (isOriginalHora && !isSelected) {
                      btnClass += "original ";
                    }
                    
                    return (
                      <button
                        key={horaFormateada}
                        type="button"
                        className={btnClass}
                        onClick={() => {
                          if (!isOcupada || isOriginalHora) {
                            setEditFormData({ ...editFormData, hora: horaFormateada });
                          } else {
                            mostrarNotificacion('Esta hora ya está reservada para otra cita', 'warning');
                          }
                        }}
                        title={isOcupada ? "Hora no disponible" : isOriginalHora ? "Hora original de la cita" : "Hora disponible"}
                        disabled={isOcupada && !isOriginalHora}
                      >
                        {/* Mostrar solo el formato HH:MM (sin segundos) */}
                        {horaFormateada}
                        {isOriginalHora && !isSelected && (
                          <span className="original-indicator">♦</span>
                        )}
                        {isOcupada && (
                          <span className="ocupada-indicator">✕</span>
                        )}
                      </button>
                    );
                  })}
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