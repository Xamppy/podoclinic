import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axiosInstance from '../../api/axios';

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

const CalendarioCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const response = await axiosInstance.get('/citas/');
        
        // Transformar las citas para el formato del calendario
        const citasFormateadas = response.data.map(cita => ({
          id: cita.id,
          title: `${cita.paciente_nombre} - ${cita.tratamiento_nombre}`,
          start: new Date(`${cita.fecha}T${cita.hora}`),
          end: new Date(new Date(`${cita.fecha}T${cita.hora}`).getTime() + cita.tratamiento.duracion_minutos * 60000),
          paciente: cita.paciente_nombre,
          tratamiento: cita.tratamiento_nombre,
          estado: cita.estado,
          resource: cita,
        }));
        
        setCitas(citasFormateadas);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // Personalización de los eventos en el calendario
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3788d8'; // color por defecto
    
    switch(event.resource.estado) {
      case 'reservada':
        backgroundColor = '#f59e0b'; // amarillo
        break;
      case 'confirmada':
        backgroundColor = '#10b981'; // verde
        break;
      case 'completada':
        backgroundColor = '#3b82f6'; // azul
        break;
      case 'cancelada':
        backgroundColor = '#ef4444'; // rojo
        break;
      default:
        backgroundColor = '#3788d8';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      }
    };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando calendario...</div>;
  }

  return (
    <div className="h-screen p-4">
      <h2 className="text-2xl font-semibold mb-4">Calendario de Citas</h2>
      
      <div className="h-5/6 bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={citas}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
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
      
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
                onClick={() => {/* Aquí iría la lógica para editar */}}
              >
                Editar
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
    </div>
  );
};

export default CalendarioCitas;