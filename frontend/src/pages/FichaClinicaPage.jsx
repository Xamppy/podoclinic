import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { useRut } from '../hooks/useRut';
import { format, differenceInYears } from 'date-fns';
import es from 'date-fns/locale/es';

const FichaClinicaPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [showCertificado, setShowCertificado] = useState(false);
  const { rut, rutError, handleRutChange } = useRut();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion_atencion: '',
    procedimiento: '',
    indicaciones: '',
    proxima_sesion_estimada: ''
  });

  const [certificadoData, setCertificadoData] = useState({
    fecha_emision: new Date().toISOString().split('T')[0],
    motivo: '',
    indicacion: '',
    dias_reposo: '',
    tipo_certificado: 'general' // general, deportivo, laboral
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

  const handleGenerarCertificado = () => {
    if (!selectedFicha) return;
    
    setCertificadoData({
      fecha_emision: new Date().toISOString().split('T')[0],
      motivo: selectedFicha.descripcion_atencion,
      indicacion: selectedFicha.indicaciones,
      dias_reposo: '',
      tipo_certificado: 'general'
    });
    setShowCertificado(true);
  };

  const handlePrintCertificado = () => {
    window.print();
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const fechaNac = new Date(fechaNacimiento);
    const edad = differenceInYears(new Date(), fechaNac);
    return edad;
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
          <h2 className="text-2xl font-semibold mb-4">Pacientes</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredPacientes.map(paciente => (
              <button
                key={paciente.rut}
                onClick={() => handlePacienteSelect(paciente.rut)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  selectedPaciente?.rut === paciente.rut
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="text-xl font-medium">{paciente.nombre}</p>
                <p className="text-lg text-gray-600">{paciente.rut}</p>
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
                  <h2 className="text-3xl font-semibold mb-2">{selectedPaciente.nombre}</h2>
                  <p className="text-xl text-gray-600 mb-1">{selectedPaciente.rut}</p>
                  {selectedPaciente.direccion && (
                    <p className="text-xl text-gray-600 mb-1">Dirección: {selectedPaciente.direccion}</p>
                  )}
                  {selectedPaciente.fecha_nacimiento && (
                    <p className="text-xl text-gray-600">
                      Edad: {calcularEdad(selectedPaciente.fecha_nacimiento)} años
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-lg"
                  >
                    Nueva Ficha
                  </button>
                  {selectedFicha && (
                    <button
                      onClick={handleGenerarCertificado}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg"
                    >
                      Generar Certificado
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {fichas.map((ficha, index) => (
                  <button
                    key={index}
                    onClick={() => handleFichaClick(ficha)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedFicha?.id === ficha.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-gray-50'
                    }`}
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
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nueva Ficha Clínica</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Atención</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Próxima Sesión Estimada</label>
                    <input
                      type="date"
                      value={formData.proxima_sesion_estimada}
                      onChange={(e) => setFormData({ ...formData, proxima_sesion_estimada: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción de la Atención</label>
                  <textarea
                    value={formData.descripcion_atencion}
                    onChange={(e) => setFormData({ ...formData, descripcion_atencion: e.target.value })}
                    rows="3"
                    placeholder="Motivo de consulta, evaluación, observaciones generales..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Procedimiento Realizado</label>
                  <textarea
                    value={formData.procedimiento}
                    onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                    rows="3"
                    placeholder="Detalles del tratamiento efectuado..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Indicaciones</label>
                  <textarea
                    value={formData.indicaciones}
                    onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                    rows="3"
                    placeholder="Recomendaciones y cuidados para el paciente..."
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

      {/* Modal de Detalles de Ficha */}
      {selectedFicha && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setSelectedFicha(null)}
        >
          <div 
            className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ficha Clínica del {formatDate(selectedFicha.fecha)}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleGenerarCertificado}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Generar Certificado
                  </button>
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
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Información del Paciente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600"><strong>Nombre:</strong> {selectedPaciente.nombre}</p>
                    <p className="text-gray-600"><strong>RUT:</strong> {selectedPaciente.rut}</p>
                  </div>
                  <div>
                    {selectedPaciente.direccion && (
                      <p className="text-gray-600"><strong>Dirección:</strong> {selectedPaciente.direccion}</p>
                    )}
                    {selectedPaciente.fecha_nacimiento && (
                      <p className="text-gray-600">
                        <strong>Edad:</strong> {calcularEdad(selectedPaciente.fecha_nacimiento)} años
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Descripción de la Atención</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedFicha.descripcion_atencion}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Procedimiento</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedFicha.procedimiento}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Indicaciones</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedFicha.indicaciones}</p>
                </div>

                {selectedFicha.proxima_sesion_estimada && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-700 mb-2">Próxima Sesión Estimada</h4>
                    <p className="text-gray-600">{formatDate(selectedFicha.proxima_sesion_estimada)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Certificado Médico */}
      {showCertificado && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowCertificado(false)}
        >
          <div 
            className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Sección visible solo en pantalla */}
            <div className="print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Generar Certificado Médico</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintCertificado}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Imprimir Certificado
                  </button>
                  <button
                    onClick={() => setShowCertificado(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Certificado</label>
                  <select
                    value={certificadoData.tipo_certificado}
                    onChange={(e) => setCertificadoData({ ...certificadoData, tipo_certificado: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="general">Certificado General</option>
                    <option value="deportivo">Certificado Deportivo</option>
                    <option value="laboral">Certificado Laboral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo</label>
                  <textarea
                    value={certificadoData.motivo}
                    onChange={(e) => setCertificadoData({ ...certificadoData, motivo: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Indicación</label>
                  <textarea
                    value={certificadoData.indicacion}
                    onChange={(e) => setCertificadoData({ ...certificadoData, indicacion: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Días de Reposo</label>
                  <input
                    type="number"
                    value={certificadoData.dias_reposo}
                    onChange={(e) => setCertificadoData({ ...certificadoData, dias_reposo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Certificado Médico (visible en pantalla e impresión) */}
            <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:shadow-none">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">CERTIFICADO MÉDICO PODOLÓGICO</h1>
                <p className="text-gray-600">{
                  certificadoData.tipo_certificado === 'deportivo' ? '(APTITUD DEPORTIVA)' :
                  certificadoData.tipo_certificado === 'laboral' ? '(APTITUD LABORAL)' : ''
                }</p>
              </div>

              <div className="mb-8">
                <p className="mb-4">
                  El/la profesional que suscribe certifica que:
                </p>
                <p className="mb-4">
                  Don/Doña <strong>{selectedPaciente.nombre}</strong>, 
                  RUT <strong>{selectedPaciente.rut}</strong>, 
                  ha sido atendido/a en esta consulta podológica con fecha <strong>{formatDate(selectedFicha.fecha)}</strong>.
                </p>
                {certificadoData.motivo && (
                  <p className="mb-4">
                    <strong>Diagnóstico / Motivo de atención:</strong><br />
                    {certificadoData.motivo}
                  </p>
                )}
                {certificadoData.indicacion && (
                  <p className="mb-4">
                    <strong>Indicación:</strong><br />
                    {certificadoData.indicacion}
                  </p>
                )}
                {certificadoData.dias_reposo && (
                  <p className="mb-4">
                    Se indica reposo por <strong>{certificadoData.dias_reposo} días</strong>.
                  </p>
                )}
                <p className="mb-4">
                  El presente certificado se extiende a solicitud del interesado y para los fines que estime convenientes.
                </p>
              </div>

              <div className="text-center mb-8">
                <p>Santiago, {formatDate(new Date())}</p>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-300">
                <div className="text-center">
                  <div className="mb-4 h-20">
                    {/* Espacio para firma */}
                  </div>
                  <p className="font-medium">NOMBRE DEL PROFESIONAL</p>
                  <p>Podólogo/a</p>
                  <p>RUT: XX.XXX.XXX-X</p>
                  <p>Registro: XXXXX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FichaClinicaPage; 