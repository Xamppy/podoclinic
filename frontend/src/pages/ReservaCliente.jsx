import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import es from 'date-fns/locale/es';

const diasSemana = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const periodos = [
  { key: 'todos', label: 'Todos los horarios' },
  { key: 'mañana', label: 'Mañana' },
  { key: 'tarde', label: 'Tarde' },
];

const getPeriodo = (hora) => {
  const [h] = hora.split(':').map(Number);
  if (h < 13) return 'mañana';
  return 'tarde';
};

export default function ReservaCliente() {
  const [semana, setSemana] = useState([]);
  const [inicioSemana, setInicioSemana] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date());
  const [filtro, setFiltro] = useState('todos');
  const [horarios, setHorarios] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', notas: '' });
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
    setSemana(dias);
    // Si el día seleccionado no está en la semana, selecciona el primer día
    if (!dias.some(d => isSameDay(d, diaSeleccionado))) {
      setDiaSeleccionado(dias[0]);
    }
  }, [inicioSemana]);

  useEffect(() => {
    if (diaSeleccionado) {
      obtenerHorarios();
    }
    // eslint-disable-next-line
  }, [diaSeleccionado]);

  const obtenerHorarios = async () => {
    setLoadingHorarios(true);
    setHoraSeleccionada(null);
    try {
      const fecha = format(diaSeleccionado, 'yyyy-MM-dd');
      const res = await fetch(`http://localhost:8000/api/citas/disponibles/?fecha=${fecha}`);
      const data = await res.json();
      setHorarios(data.horas_disponibles || []);
    } catch (e) {
      setHorarios([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const horariosFiltrados = horarios.filter(h =>
    filtro === 'todos' ? true : getPeriodo(h) === filtro
  );

  const handleReservar = () => {
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const body = {
        ...formData,
        fecha: format(diaSeleccionado, 'yyyy-MM-dd'),
        hora: horaSeleccionada,
        servicio: 'Consulta General', // Puedes cambiar esto o hacerlo seleccionable
      };
      const res = await fetch('http://localhost:8000/api/citas/reservar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMensaje('¡Reserva realizada con éxito!');
        setShowModal(false);
        setFormData({ nombre: '', email: '', telefono: '', notas: '' });
        setHoraSeleccionada(null);
        obtenerHorarios();
      } else {
        const error = await res.json();
        setMensaje(error.error || 'Error al reservar.');
      }
    } catch (e) {
      setMensaje('Error de conexión.');
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-xl font-bold mb-4 text-center">
        Semana del {format(semana[0] || inicioSemana, "d 'de' MMMM", { locale: es })} al {format(semana[6] || inicioSemana, "d 'de' MMMM", { locale: es })}
      </h2>
      <div className="flex justify-center items-center mb-6 space-x-2">
        <button onClick={() => setInicioSemana(subWeeks(inicioSemana, 1))} className="text-2xl px-2">&#60;</button>
        {semana.map((dia, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${isSameDay(dia, diaSeleccionado) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setDiaSeleccionado(dia)}
          >
            <span className="text-xs font-medium">{diasSemana[idx]}</span>
            <span className="text-lg font-bold">{format(dia, 'd')}</span>
          </button>
        ))}
        <button onClick={() => setInicioSemana(addWeeks(inicioSemana, 1))} className="text-2xl px-2">&#62;</button>
      </div>
      <div className="mb-4 flex justify-center space-x-2">
        {periodos.map(p => (
          <button
            key={p.key}
            onClick={() => setFiltro(p.key)}
            className={`px-3 py-1 rounded ${filtro === p.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {loadingHorarios ? (
          <span>Cargando horarios...</span>
        ) : horariosFiltrados.length === 0 ? (
          <span>No hay horarios disponibles</span>
        ) : (
          horariosFiltrados.map(h => (
            <button
              key={h}
              className={`px-6 py-2 rounded-lg ${horaSeleccionada === h ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
              onClick={() => setHoraSeleccionada(h)}
            >
              {h}
            </button>
          ))
        )}
      </div>
      <button
        className="w-full bg-blue-400 text-white py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
        disabled={!horaSeleccionada}
        onClick={handleReservar}
      >
        Reservar
      </button>
      {/* Modal de datos personales */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4 text-center">Tus datos</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <input type="text" required className="mt-1 block w-full rounded border-gray-300" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                <input type="email" required className="mt-1 block w-full rounded border-gray-300" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" required className="mt-1 block w-full rounded border-gray-300" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
                <textarea className="mt-1 block w-full rounded border-gray-300" value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold">Confirmar Reserva</button>
            </form>
          </div>
        </div>
      )}
      {mensaje && (
        <div className="mt-4 text-center text-green-600 font-semibold">{mensaje}</div>
      )}
    </div>
  );
} 