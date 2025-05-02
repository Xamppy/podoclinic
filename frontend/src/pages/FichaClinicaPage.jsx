import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';

const FichaClinicaPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { rut, rutError, handleRutChange } = useRut();

  const [formData, setFormData] = useState({
    descripcion: '',
    procedimiento: '',
    indicaciones: '',
    proxima_sesion: ''
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
      setFichas(response.data);
      setSelectedPaciente(pacientes.find(p => p.rut === rut));
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return;

    try {
      await pacientesService.createFichaClinica(selectedPaciente.rut, formData);
      setShowForm(false);
      handlePacienteSelect(selectedPaciente.rut);
      setFormData({
        descripcion: '',
        procedimiento: '',
        indicaciones: '',
        proxima_sesion: ''
      });
    } catch (error) {
      console.error('Error al crear ficha:', error);
    }
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
          <div className="space-y-2">
            {pacientes.map(paciente => (
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

        {/* Fichas del Paciente Seleccionado */}
        <div className="md:col-span-2">
          {selectedPaciente ? (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPaciente.nombre}</h2>
                  <p className="text-gray-600">{selectedPaciente.rut}</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Nueva Ficha
                </button>
              </div>

              <div className="space-y-6">
                {fichas.map((ficha, index) => (
                  <div key={index} className="border-b pb-4">
                    <p className="text-sm text-gray-500">{ficha.fecha}</p>
                    <p className="font-medium mt-2">Descripción</p>
                    <p className="text-gray-700">{ficha.descripcion}</p>
                    <p className="font-medium mt-2">Procedimiento</p>
                    <p className="text-gray-700">{ficha.procedimiento}</p>
                    <p className="font-medium mt-2">Indicaciones</p>
                    <p className="text-gray-700">{ficha.indicaciones}</p>
                    <p className="font-medium mt-2">Próxima Sesión</p>
                    <p className="text-gray-700">{ficha.proxima_sesion}</p>
                  </div>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Ficha Clínica</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700">Próxima Sesión</label>
                  <input
                    type="date"
                    value={formData.proxima_sesion}
                    onChange={(e) => setFormData({ ...formData, proxima_sesion: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
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
    </div>
  );
};

export default FichaClinicaPage; 