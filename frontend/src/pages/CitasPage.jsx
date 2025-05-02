import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { citasService } from '../api/citas';
import { pacientesService } from '../api/pacientes';
import { useWhatsApp } from '../context/WhatsAppContext';

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

const TIPOS_TRATAMIENTO = [
  'Podología general',
  'Reflexología Podal',
  'Uñas con hongos (Onicomicosis)',
  'Uña encarnada (Onicocriptosis)',
  'Curación Podología',
  'Retiro de esmalte'
];

const CitasPage = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const { enviarConfirmacionCita } = useWhatsApp();

  const [formData, setFormData] = useState({
    paciente_rut: '',
    fecha: '',
    hora: '',
    tipo_tratamiento: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [citasRes, pacientesRes] = await Promise.all([
        citasService.getAll(),
        pacientesService.getAll()
      ]);
      setCitas(citasRes.data);
      setPacientes(pacientesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async ({ start }) => {
    setSelectedDate(start);
    setFormData(prev => ({ ...prev, fecha: format(start, 'yyyy-MM-dd') }));
    try {
      const response = await citasService.getHorariosDisponibles(format(start, 'yyyy-MM-dd'));
      setHorariosDisponibles(response.data);
      setShowForm(true);
    } catch (error) {
      console.error('Error al obtener horarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await citasService.create(formData);
      await enviarConfirmacionCita(response.data);
      setShowForm(false);
      cargarDatos();
      setFormData({
        paciente_rut: '',
        fecha: '',
        hora: '',
        tipo_tratamiento: ''
      });
    } catch (error) {
      console.error('Error al crear cita:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  const eventos = citas.map(cita => ({
    id: cita.id,
    title: `${cita.paciente_nombre} - ${cita.tipo_tratamiento}`,
    start: new Date(`${cita.fecha}T${cita.hora}`),
    end: new Date(`${cita.fecha}T${cita.hora}`),
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendario de Citas</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectSlot={handleSelectSlot}
          selectable
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Cita</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Paciente</label>
                  <select
                    value={formData.paciente_rut}
                    onChange={(e) => setFormData({ ...formData, paciente_rut: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700">Hora</label>
                  <select
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleccione una hora</option>
                    {horariosDisponibles.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Tipo de Tratamiento</label>
                  <select
                    value={formData.tipo_tratamiento}
                    onChange={(e) => setFormData({ ...formData, tipo_tratamiento: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleccione un tratamiento</option>
                    {TIPOS_TRATAMIENTO.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
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
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitasPage; 