import React, { useState, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';
import { insumosService } from '../api/insumos';
import { differenceInYears, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

const FichaClinicaPage = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [showCertificado, setShowCertificado] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState('none'); // 'none', 'view', 'edit'

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion_atencion: '',
    procedimiento: '',
    indicaciones: '',
    productos_usados: []
  });

  const [certificadoData, setCertificadoData] = useState({
    fecha_emision: new Date().toISOString().split('T')[0],
    motivo: '',
    indicacion: '',
    dias_reposo: '',
    tipo_certificado: 'general' // general, deportivo, laboral
  });

  const [productosInventario, setProductosInventario] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);

  useEffect(() => {
    cargarPacientes();
    cargarProductosInventario();
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

  const cargarProductosInventario = async () => {
    try {
      const response = await insumosService.getAll();
      setProductosInventario(response.data);
    } catch (error) {
      console.error('Error al cargar productos de inventario:', error);
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
    if (viewMode !== 'none') return; // No hacer nada si ya hay un modal abierto
    setSelectedFicha(ficha);
    setViewMode('view');
  };

  const handleEditClick = (e, ficha) => {
    e.stopPropagation(); // Evitar que se propague al click de la ficha
    setSelectedFicha(ficha);
    
    // Asegurarse de que los productos usados estén correctamente formateados
    const productosFormateados = ficha.productos_usados.map(p => ({
      id: p.insumo,
      nombre: p.nombre_insumo || p.nombre,
      cantidad: p.cantidad,
      insumo: p.insumo // Asegurar que tengamos ambos campos
    }));
    
    console.log('Productos formateados para edición:', productosFormateados);
    
    setFormData({
      fecha: ficha.fecha,
      descripcion_atencion: ficha.descripcion_atencion,
      procedimiento: ficha.procedimiento,
      indicaciones: ficha.indicaciones,
      productos_usados: productosFormateados
    });
    setViewMode('edit');
  };

  const handleCloseModal = () => {
    if (viewMode === 'edit') {
      setViewMode('view');
    } else {
      setSelectedFicha(null);
      setViewMode('none');
    }
    
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion_atencion: '',
      procedimiento: '',
      indicaciones: '',
      productos_usados: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return;

    try {
      // Preparar los datos de la ficha
      const productosFormateados = formData.productos_usados.map(p => ({
        insumo: parseInt(p.id || p.insumo),
        cantidad: parseInt(p.cantidad),
        nombre_insumo: p.nombre
      }));
      
      console.log('Productos formateados para enviar:', productosFormateados);
      
      const fichaData = {
        fecha: formData.fecha,
        descripcion_atencion: formData.descripcion_atencion,
        procedimiento: formData.procedimiento,
        indicaciones: formData.indicaciones,
        productos_usados_data: productosFormateados,
        paciente: selectedPaciente.id
      };

      console.log('Enviando datos de ficha:', fichaData);

      let response;
      if (viewMode === 'edit' && selectedFicha) {
        response = await pacientesService.updateFichaClinica(selectedFicha.id, fichaData);
        if (response.status === 200) {
          // Actualizar la ficha seleccionada con los datos de la respuesta
          const fichaActualizada = response.data;
          setSelectedFicha(fichaActualizada);
          
          // Actualizar la lista de fichas
          setFichas(prevFichas => 
            prevFichas.map(ficha => 
              ficha.id === selectedFicha.id ? fichaActualizada : ficha
            )
          );
          
          await cargarProductosInventario(); // Recargar inventario
          setViewMode('view');
          
          // Mostrar mensaje de éxito
          alert('Ficha clínica actualizada correctamente');
        }
      } else {
        response = await pacientesService.createFichaClinica(selectedPaciente.rut, fichaData);
        if (response.status === 201) {
          await handlePacienteSelect(selectedPaciente.rut);
          await cargarProductosInventario(); // Recargar inventario
          setShowForm(false);
          
          // Mostrar mensaje de éxito
          alert('Ficha clínica creada correctamente');
        }
      }
      
      // Resetear formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        descripcion_atencion: '',
        procedimiento: '',
        indicaciones: '',
        productos_usados: []
      });
    } catch (error) {
      console.error('Error al guardar ficha:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
        
        // Mostrar mensaje de error
        if (error.response.data && typeof error.response.data === 'object') {
          const errorMessages = [];
          for (const key in error.response.data) {
            errorMessages.push(`${key}: ${error.response.data[key]}`);
          }
          alert(`Error: ${errorMessages.join('\n')}`);
        } else {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const limpiarRut = (rut) => {
    return rut.replace(/[^0-9kK]/g, '');
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Si el término de búsqueda está vacío, mostrar todos
    if (!searchTermLower) return true;
    
    // Filtrar por nombre (siempre buscar en el nombre)
    const nombreMatch = paciente.nombre.toLowerCase().includes(searchTermLower);
    
    // Filtrar por RUT solo si el término de búsqueda contiene números o 'k'
    let rutMatch = false;
    if (/[0-9kK]/.test(searchTerm)) {
      const searchTermLimpio = limpiarRut(searchTerm);
      const rutPacienteLimpio = limpiarRut(paciente.rut);
      rutMatch = rutPacienteLimpio.includes(searchTermLimpio);
    }
    
    return nombreMatch || rutMatch;
  });

  const formatDate = (dateString) => {
    try {
      // Usar parseISO para interpretar correctamente la fecha sin problemas de timezone
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error, dateString);
      return dateString; // Devolver la fecha original si hay error
    }
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
    try {
      // Usar parseISO para interpretar correctamente la fecha sin problemas de timezone
      const fechaNac = parseISO(fechaNacimiento);
      const edad = differenceInYears(new Date(), fechaNac);
      return edad;
    } catch (error) {
      console.error('Error al calcular edad:', error, fechaNacimiento);
      return null;
    }
  };

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadProducto < 1) return;
    
    // Verificar que no se exceda el stock disponible
    if (cantidadProducto > productoSeleccionado.stock_actual) {
      alert(`No hay suficiente stock disponible. Stock actual: ${productoSeleccionado.stock_actual}`);
      return;
    }
    
    // Clonar el producto seleccionado para evitar referencias cruzadas
    const nuevoProducto = {
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      cantidad: cantidadProducto,
      insumo: productoSeleccionado.id
    };
    
    console.log('Agregando producto:', nuevoProducto);
    
    // Actualizar el estado de productos usados de forma inmutada
    const nuevosProductos = [...formData.productos_usados, nuevoProducto];
    console.log('Productos usados actualizados:', nuevosProductos);
    
    // Actualizar el estado del formulario con los nuevos productos
    setFormData(prevState => ({
      ...prevState,
      productos_usados: nuevosProductos
    }));
    
    // Limpiar la selección actual
    setProductoSeleccionado(null);
    setCantidadProducto(1);
  };

  const eliminarProducto = (index) => {
    setFormData(prevState => ({
      ...prevState,
      productos_usados: prevState.productos_usados.filter((_, i) => i !== index)
    }));
    
    console.log('Producto eliminado en índice:', index);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Fichas Clínicas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lista de Pacientes */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">Pacientes</h2>
          <div className="mb-3 sm:mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 text-base sm:text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
          <div className="space-y-2 max-h-[40vh] sm:max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredPacientes.map(paciente => (
              <button
                key={paciente.rut}
                onClick={() => handlePacienteSelect(paciente.rut)}
                className={`w-full text-left p-3 sm:p-4 rounded-lg transition-colors min-h-[44px] ${
                  selectedPaciente?.rut === paciente.rut
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="text-base sm:text-xl font-medium">{paciente.nombre}</p>
                <p className="text-sm sm:text-lg text-gray-600">{paciente.rut}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Fichas del Paciente Seleccionado */}
        <div className="lg:col-span-2">
          {selectedPaciente ? (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-3xl font-semibold mb-2">{selectedPaciente.nombre}</h2>
                  <div className="space-y-1">
                    <p className="text-base sm:text-xl text-indigo-600">{selectedPaciente.rut}</p>
                    {selectedPaciente.direccion && (
                      <p className="text-sm sm:text-xl text-indigo-600">Dirección: {selectedPaciente.direccion}</p>
                    )}
                    {selectedPaciente.fecha_nacimiento && (
                      <p className="text-base sm:text-xl font-bold text-indigo-600">
                        Edad: {calcularEdad(selectedPaciente.fecha_nacimiento)} años
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-base sm:text-lg min-h-[44px]"
                  >
                    Nueva Ficha
                  </button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 max-h-[40vh] sm:max-h-[calc(100vh-300px)] overflow-y-auto">
                {fichas.map((ficha, index) => (
                  <button
                    key={index}
                    onClick={() => handleFichaClick(ficha)}
                    className={`w-full text-left p-3 sm:p-4 border rounded-lg transition-colors min-h-[44px] ${
                      selectedFicha?.id === ficha.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <h3 className="font-medium text-sm sm:text-base">Ficha del {formatDate(ficha.fecha)}</h3>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2 text-sm sm:text-base">{ficha.descripcion_atencion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center text-gray-500">
              <p className="text-sm sm:text-base">Seleccione un paciente para ver sus fichas clínicas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nueva Ficha */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-full sm:max-w-2xl shadow-lg rounded-md bg-white min-h-[calc(100vh-2rem)] sm:min-h-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {isEditing ? 'Editar Ficha Clínica' : 'Nueva Ficha Clínica'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsEditing(false);
                    setFormData({
                      fecha: new Date().toISOString().split('T')[0],
                      descripcion_atencion: '',
                      procedimiento: '',
                      indicaciones: '',
                      productos_usados: []
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500 self-end sm:self-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Sección 1: Información Básica */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Información Básica</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Atención</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] text-base"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2: Descripción de la Atención */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Descripción de la Atención</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta y evaluación</label>
                    <textarea
                      value={formData.descripcion_atencion}
                      onChange={(e) => setFormData({ ...formData, descripcion_atencion: e.target.value })}
                      rows="4"
                      placeholder="Motivo de consulta, evaluación, observaciones generales..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Sección 3: Procedimiento */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Procedimiento Realizado</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalles del tratamiento</label>
                    <textarea
                      value={formData.procedimiento}
                      onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                      rows="4"
                      placeholder="Detalles del tratamiento efectuado..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Sección 4: Indicaciones */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Indicaciones</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones para el paciente</label>
                    <textarea
                      value={formData.indicaciones}
                      onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                      rows="4"
                      placeholder="Recomendaciones y cuidados para el paciente..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>
                
                {/* Nueva sección para productos usados */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-700 mb-3">Productos Utilizados</h4>
                  
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        value={productoSeleccionado?.id || ''}
                        onChange={(e) => {
                          const productoId = e.target.value;
                          const producto = productosInventario.find(p => p.id.toString() === productoId);
                          setProductoSeleccionado(producto || null);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Seleccione un producto</option>
                        {productosInventario.map(producto => (
                          <option 
                            key={producto.id} 
                            value={producto.id}
                            disabled={producto.stock_actual <= 0}
                          >
                            {producto.nombre} ({producto.stock_actual} {producto.unidad_medida} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={productoSeleccionado?.stock_actual || 1}
                        value={cantidadProducto}
                        onChange={(e) => setCantidadProducto(parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={agregarProducto}
                        disabled={!productoSeleccionado}
                        className="w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                  
                  {/* Lista de productos agregados - Responsive */}
                  {formData.productos_usados.length > 0 && (
                    <div className="mt-3">
                      {/* Vista de tabla para pantallas grandes */}
                      <div className="hidden sm:block border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {formData.productos_usados.map((producto, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{producto.nombre}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{producto.cantidad}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  <button
                                    type="button"
                                    onClick={() => eliminarProducto(index)}
                                    className="text-red-500 hover:text-red-700 min-h-[44px] px-2"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Vista de tarjetas para móviles */}
                      <div className="sm:hidden space-y-2">
                        {formData.productos_usados.map((producto, index) => (
                          <div key={index} className="bg-white border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{producto.nombre}</p>
                                <p className="text-gray-600 text-sm">Cantidad: {producto.cantidad}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarProducto(index)}
                                className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 min-h-[44px] text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 min-h-[44px] text-base"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista de Ficha */}
      {viewMode === 'view' && selectedFicha && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-full sm:max-w-4xl shadow-lg rounded-md bg-white min-h-[calc(100vh-2rem)] sm:min-h-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Ficha Clínica del {formatDate(selectedFicha.fecha)}
                </h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={(e) => {
                      handleCloseModal();
                      handleEditClick(e, selectedFicha);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 min-h-[44px] text-base"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleGenerarCertificado}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 min-h-[44px] text-base"
                  >
                    Generar Certificado
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 self-end sm:self-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Información del Paciente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <p className="text-gray-600 text-sm sm:text-base"><strong>Nombre:</strong> {selectedPaciente.nombre}</p>
                    <p className="text-gray-600 text-sm sm:text-base"><strong>RUT:</strong> {selectedPaciente.rut}</p>
                  </div>
                  <div className="space-y-1">
                    {selectedPaciente.direccion && (
                      <p className="text-gray-600 text-sm sm:text-base"><strong>Dirección:</strong> {selectedPaciente.direccion}</p>
                    )}
                    {selectedPaciente.fecha_nacimiento && (
                      <p className="text-gray-600 text-sm sm:text-base">
                        <strong>Edad:</strong> {calcularEdad(selectedPaciente.fecha_nacimiento)} años
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Descripción de la Atención</h4>
                  <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{selectedFicha.descripcion_atencion}</p>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Procedimiento</h4>
                  <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{selectedFicha.procedimiento}</p>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Indicaciones</h4>
                  <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{selectedFicha.indicaciones}</p>
                </div>

                {/* Mostrar productos utilizados si existen */}
                {selectedFicha.productos_usados && selectedFicha.productos_usados.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-700 mb-2">Productos Utilizados</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedFicha.productos_usados.map((producto, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">{producto.nombre_insumo || producto.nombre}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-center">{producto.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 text-right">
                        <p className="text-lg font-semibold text-gray-700">
                          Costo Total: {selectedFicha.costo_total_formato || '$0'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {viewMode === 'edit' && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-full sm:max-w-2xl shadow-lg rounded-md bg-white min-h-[calc(100vh-2rem)] sm:min-h-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Editar Ficha Clínica
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500 self-end sm:self-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Sección 1: Información Básica */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Información Básica</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Atención</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] text-base"
                      required
                    />
                  </div>
                </div>

                {/* Sección 2: Descripción de la Atención */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Descripción de la Atención</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta y evaluación</label>
                    <textarea
                      value={formData.descripcion_atencion}
                      onChange={(e) => setFormData({ ...formData, descripcion_atencion: e.target.value })}
                      rows="4"
                      placeholder="Motivo de consulta, evaluación, observaciones generales..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Sección 3: Procedimiento */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Procedimiento Realizado</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalles del tratamiento</label>
                    <textarea
                      value={formData.procedimiento}
                      onChange={(e) => setFormData({ ...formData, procedimiento: e.target.value })}
                      rows="4"
                      placeholder="Detalles del tratamiento efectuado..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Sección 4: Indicaciones */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">Indicaciones</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones para el paciente</label>
                    <textarea
                      value={formData.indicaciones}
                      onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                      rows="4"
                      placeholder="Recomendaciones y cuidados para el paciente..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                      required
                    />
                  </div>
                </div>
                
                {/* Nueva sección para productos usados */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-700 mb-3">Productos Utilizados</h4>
                  
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        value={productoSeleccionado?.id || ''}
                        onChange={(e) => {
                          const productoId = e.target.value;
                          const producto = productosInventario.find(p => p.id.toString() === productoId);
                          setProductoSeleccionado(producto || null);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Seleccione un producto</option>
                        {productosInventario.map(producto => (
                          <option 
                            key={producto.id} 
                            value={producto.id}
                            disabled={producto.stock_actual <= 0}
                          >
                            {producto.nombre} ({producto.stock_actual} {producto.unidad_medida} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={productoSeleccionado?.stock_actual || 1}
                        value={cantidadProducto}
                        onChange={(e) => setCantidadProducto(parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={agregarProducto}
                        disabled={!productoSeleccionado}
                        className="w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabla de productos agregados */}
                  {formData.productos_usados.length > 0 && (
                    <div className="mt-3 border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.productos_usados.map((producto, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">{producto.nombre}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">{producto.cantidad}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarProducto(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 min-h-[44px] text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 min-h-[44px] text-base"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Certificado Médico */}
      {showCertificado && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4"
          onClick={() => setShowCertificado(false)}
        >
          <div 
            className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-full sm:max-w-4xl shadow-lg rounded-md bg-white min-h-[calc(100vh-2rem)] sm:min-h-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Sección visible solo en pantalla */}
            <div className="print:hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Generar Certificado</h3>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handlePrintCertificado}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 min-h-[44px] text-base"
                  >
                    Imprimir Certificado
                  </button>
                  <button
                    onClick={() => setShowCertificado(false)}
                    className="text-gray-400 hover:text-gray-500 self-end sm:self-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Certificado</label>
                  <select
                    value={certificadoData.tipo_certificado}
                    onChange={(e) => setCertificadoData({ ...certificadoData, tipo_certificado: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] text-base"
                  >
                    <option value="general">Certificado General</option>
                    <option value="deportivo">Certificado Deportivo</option>
                    <option value="laboral">Certificado Laboral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <textarea
                    value={certificadoData.motivo}
                    onChange={(e) => setCertificadoData({ ...certificadoData, motivo: e.target.value })}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indicación</label>
                  <textarea
                    value={certificadoData.indicacion}
                    onChange={(e) => setCertificadoData({ ...certificadoData, indicacion: e.target.value })}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de Reposo</label>
                  <input
                    type="number"
                    value={certificadoData.dias_reposo}
                    onChange={(e) => setCertificadoData({ ...certificadoData, dias_reposo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] text-base"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Certificado (visible en pantalla e impresión) */}
            <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:shadow-none certificado-contenedor" style={{ position: 'relative' }}>
              <img
                src={`${process.env.PUBLIC_URL}/logo-podoclinic.png`}
                alt="Logo Podoclinic"
                style={{ width: 120, position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'block' }}
              />
              <div style={{ marginLeft: 0, marginTop: 0 }}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">CERTIFICADO PODOLÓGICO</h1>
                <p className="text-gray-600">{
                  certificadoData.tipo_certificado === 'deportivo' ? '(APTITUD DEPORTIVA)' :
                  certificadoData.tipo_certificado === 'laboral' ? '(APTITUD LABORAL)' : ''
                }</p>
              </div>

              <div className="mb-8">
                <p className="mb-4">
                  La profesional que suscribe certifica que:
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
                <p>La Cruz, {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-300">
                <div className="text-center">
                  <div className="mb-4 h-20">
                    {/* Espacio para firma */}
                  </div>
                  <p className="font-medium">Esmeralda Valdevenito V.</p>
                  <p>Podóloga</p>
                  <p>RUT: 10.925.406-1</p>
                  <p>ROL: N° 3578</p>
                  <p>VILLA EL BOSQUE - ALCALDE SERGIO JORQUERA N°65, LA CRUZ, REGIÓN DE VALPARAÍSO</p>
                </div>
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