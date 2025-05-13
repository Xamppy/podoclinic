import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';

const FichaClinicaPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const { rut, rutError, handleRutChange } = useRut();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion_atencion: '',
    procedimiento: '',
    indicaciones: '',
    proxima_sesion_estimada: ''
  });

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const response = await pacientesService.getAll();
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePacienteSelect = async (rut) => {
    try {
      const response = await pacientesService.getFichaClinica(rut);
      // Ordenar fichas por fecha de más reciente a más antigua
      const fichasOrdenadas = response.data.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      setFichas(fichasOrdenadas);
      setSelectedPaciente(pacientes.find(p => p.rut === rut));
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const handleFichaClick = (ficha) => {
    setSelectedFicha(ficha);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return;

    try {
      const fichaData = {
        ...formData,
        descripcion_atencion: formData.descripcion_atencion,
        fecha: formData.fecha,
        proxima_sesion_estimada: formData.proxima_sesion_estimada
      };
      
      await pacientesService.createFichaClinica(selectedPaciente.rut, fichaData);
      setShowForm(false);
      handlePacienteSelect(selectedPaciente.rut);
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        descripcion_atencion: '',
        procedimiento: '',
        indicaciones: '',
        proxima_sesion_estimada: ''
      });
    } catch (error) {
      console.error('Error al crear ficha:', error);
    }
  };

  const limpiarRut = (rut) => {
    return rut.replace(/[^0-9kK]/g, '');
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const searchTermLimpio = limpiarRut(searchTerm);
    const rutPacienteLimpio = limpiarRut(paciente.rut);
    
    return paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           rutPacienteLimpio.includes(searchTermLimpio);
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fichas Clínicas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pacientes</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            {filteredPacientes.map(paciente => (
              <button
                key={paciente.rut}
                onClick={() => handlePacienteSelect(paciente.rut)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPaciente?.rut === paciente.rut
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-medium">{paciente.nombre}</p>
                <p className="text-sm text-gray-600">{paciente.rut}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Fichas del Paciente Seleccionado */}
        <div className="md:col-span-2">
          {selectedPaciente ? (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPaciente.nombre}</h2>
                  <p className="text-gray-600">{selectedPaciente.rut}</p>
                  {selectedPaciente.direccion && (
                    <p className="text-gray-600 mt-1">Dirección: {selectedPaciente.direccion}</p>
                  )}
                  {selectedPaciente.fecha_nacimiento && (
                    <p className="text-gray-600 mt-1">Fecha de nacimiento: {formatDate(selectedPaciente.fecha_nacimiento)}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Nueva Ficha
                </button>
              </div>

              <div className="space-y-4">
                {fichas.map((ficha, index) => (
                  <button
                    key={index}
                    onClick={() => handleFichaClick(ficha)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Ficha del {formatDate(ficha.fecha)}</h3>
                      <span className="text-sm text-gray-500">
                        {ficha.proxima_sesion_estimada ? 
                          `Próxima sesión: ${formatDate(ficha.proxima_sesion_estimada)}` : 
                          'Sin próxima sesión programada'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">{ficha.descripcion_atencion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              Seleccione un paciente para ver sus fichas clínicas
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nueva Ficha */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Ficha Clínica</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Descripción de la Atención</label>
                  <textarea
                    value={formData.descripcion_atencion}
                    onChange={(e) => setFormData({ ...formData, descripcion_atencion: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Procedimiento</label>
                  <textarea
                    value={formData.procedimiento}
                    onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Indicaciones</label>
                  <textarea
                    value={formData.indicaciones}
                    onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Próxima Sesión Estimada</label>
                  <input
                    type="date"
                    value={formData.proxima_sesion_estimada}
                    onChange={(e) => setFormData({ ...formData, proxima_sesion_estimada: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
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

      {/* Modal de Detalles de Ficha */}
      {selectedFicha && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setSelectedFicha(null)}
        >
          <div 
            className="relative top-20 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-md bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ficha Clínica del {formatDate(selectedFicha.fecha)}
                </h3>
                <button
                  onClick={() => setSelectedFicha(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Información del Paciente</h4>
                <p className="text-gray-600"><strong>Nombre:</strong> {selectedPaciente.nombre}</p>
                <p className="text-gray-600"><strong>RUT:</strong> {selectedPaciente.rut}</p>
                {selectedPaciente.direccion && (
                  <p className="text-gray-600"><strong>Dirección:</strong> {selectedPaciente.direccion}</p>
                )}
                {selectedPaciente.fecha_nacimiento && (
                  <p className="text-gray-600"><strong>Fecha de nacimiento:</strong> {formatDate(selectedPaciente.fecha_nacimiento)}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Descripción de la Atención</h4>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedFicha.descripcion_atencion}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Procedimiento</h4>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedFicha.procedimiento}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Indicaciones</h4>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedFicha.indicaciones}</p>
                </div>

                {selectedFicha.proxima_sesion_estimada && (
                  <div>
                    <h4 className="font-medium text-gray-700">Próxima Sesión Estimada</h4>
                    <p className="mt-1 text-gray-600">{formatDate(selectedFicha.proxima_sesion_estimada)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichaClinicaPage; 