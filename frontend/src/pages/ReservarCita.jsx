import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReservarCita = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fecha: '',
    hora: '',
    servicio: '',
    tipoCita: 'podologica',
    notas: ''
  });

  const servicios = {
    podologica: [
      { id: 1, nombre: 'Consulta General' },
      { id: 2, nombre: 'Tratamiento de Uñas' },
      { id: 3, nombre: 'Tratamiento de Callos' },
      { id: 4, nombre: 'Masaje Podal' },
      { id: 5, nombre: 'Dermatomicoticos' },
      { id: 6, nombre: 'Postura de brackets' },
      { id: 7, nombre: 'Helomas interdigitales' }
    ],
    manicura: [
      { id: 1, nombre: 'Manicura Básica' },
      { id: 2, nombre: 'Manicura Spa' },
      { id: 3, nombre: 'Decoración de Uñas' },
      { id: 4, nombre: 'Tratamiento de Cutículas' }
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      ...(name === 'tipoCita' && { servicio: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mapear tipoCita a tipo_cita para el backend
      const datosParaEnviar = {
        ...formData,
        tipo_cita: formData.tipoCita === 'podologica' ? 'podologia' : 'manicura'
      };
      
      console.log('Enviando datos al backend:', datosParaEnviar);
      
      const response = await fetch('http://localhost:8000/api/citas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaEnviar),
      });

      if (response.ok) {
        alert('Cita reservada exitosamente');
        navigate('/');
      } else {
        alert('Error al reservar la cita');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const getButtonColor = () => {
    return formData.tipoCita === 'podologica' 
      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      : 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Reservar una Cita
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tipoCita" className="block text-sm font-medium text-gray-700">
              Tipo de Cita
            </label>
            <select
              name="tipoCita"
              id="tipoCita"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.tipoCita}
              onChange={handleChange}
            >
              <option value="podologica">Cita Podológica</option>
              <option value="manicura">Cita de Manicura</option>
            </select>
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              id="telefono"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="servicio" className="block text-sm font-medium text-gray-700">
              Servicio
            </label>
            <select
              name="servicio"
              id="servicio"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.servicio}
              onChange={handleChange}
            >
              <option value="">Seleccione un servicio</option>
              {servicios[formData.tipoCita].map(servicio => (
                <option key={servicio.id} value={servicio.nombre}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              id="fecha"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.fecha}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="hora" className="block text-sm font-medium text-gray-700">
              Hora
            </label>
            <input
              type="time"
              name="hora"
              id="hora"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.hora}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              id="notas"
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.notas}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${getButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Reservar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservarCita; 