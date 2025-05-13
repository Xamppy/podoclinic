import React, { useState, useEffect, useRef, Fragment } from 'react';
import { insumosService } from '../api/insumos';
import { Menu, Transition } from '@headlessui/react';
import { FunnelIcon, PrinterIcon, PlusIcon } from '@heroicons/react/24/outline';

const InventarioPage = () => {
  const [insumos, setInsumos] = useState([]);
  const [insumosFiltered, setInsumosFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    soloStockCritico: false,
    ordenarPor: 'nombre',
    ordenDireccion: 'asc'
  });

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: '',
    stock_actual: '',
    stock_critico: ''
  });

  useEffect(() => {
    cargarInsumos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [insumos, filterOptions]);

  const cargarInsumos = async () => {
    try {
      const response = await insumosService.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      setInsumos(data);
      
      // Verificar stock crítico
      const insumosCriticos = data.filter(
        insumo => insumo.stock_actual <= insumo.stock_critico
      );
      
      if (insumosCriticos.length > 0) {
        setAlertMessage(`¡Alerta! Los siguientes insumos están en stock crítico: ${insumosCriticos.map(i => i.nombre).join(', ')}`);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error);
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let insumosOrdenados = [...insumos];
    
    // Filtrar solo stock crítico si está activado
    if (filterOptions.soloStockCritico) {
      insumosOrdenados = insumosOrdenados.filter(
        insumo => insumo.stock_actual <= insumo.stock_critico
      );
    }
    
    // Ordenar según el criterio seleccionado
    insumosOrdenados.sort((a, b) => {
      let comparacion = 0;
      
      if (filterOptions.ordenarPor === 'nombre') {
        comparacion = a.nombre.localeCompare(b.nombre);
      } else if (filterOptions.ordenarPor === 'stock_actual') {
        comparacion = a.stock_actual - b.stock_actual;
      } else if (filterOptions.ordenarPor === 'stock_critico') {
        comparacion = a.stock_actual - a.stock_critico - (b.stock_actual - b.stock_critico);
      }
      
      return filterOptions.ordenDireccion === 'asc' ? comparacion : -comparacion;
    });
    
    setInsumosFiltered(insumosOrdenados);
  };

  // Función para imprimir usando window.print() nativo del navegador
  const imprimirListaCompras = () => {
    // Primero aplicamos el filtro de stock crítico
    const filtroAnterior = filterOptions.soloStockCritico;
    setFilterOptions(prev => ({
      ...prev,
      soloStockCritico: true
    }));

    // Damos un poco de tiempo para que se aplique el filtro
    setTimeout(() => {
      // Creamos una ventana nueva para la impresión
      const ventanaImpresion = window.open('', '_blank');
      
      if (!ventanaImpresion) {
        alert("Por favor permite ventanas emergentes para imprimir.");
        return;
      }

      // Obtenemos solo los insumos críticos
      const insumosCriticos = insumos.filter(insumo => insumo.stock_actual <= insumo.stock_critico);
      
      // Creamos el contenido HTML de la impresión
      const contenidoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lista de Insumos para Compra</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 10px;
            }
            .fecha {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr.critico {
              background-color: #ffeeee;
            }
            .faltante {
              font-weight: bold;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Lista de Insumos para Compra</h1>
          <p class="fecha">Fecha: ${new Date().toLocaleDateString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Stock Crítico</th>
                <th>Faltante</th>
              </tr>
            </thead>
            <tbody>
              ${insumosCriticos.length > 0 
                ? insumosCriticos.map(insumo => `
                  <tr class="critico">
                    <td>${insumo.nombre}</td>
                    <td>${insumo.descripcion || '-'}</td>
                    <td>${insumo.unidad_medida}</td>
                    <td>${insumo.stock_actual}</td>
                    <td>${insumo.stock_critico}</td>
                    <td class="faltante">${insumo.stock_actual < insumo.stock_critico ? (insumo.stock_critico - insumo.stock_actual) : 0}</td>
                  </tr>
                `).join('')
                : '<tr><td colspan="6" style="text-align: center;">No hay insumos en stock crítico</td></tr>'
              }
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Imprimir</button>
          </div>
        </body>
        </html>
      `;
      
      // Escribimos el contenido en la nueva ventana
      ventanaImpresion.document.open();
      ventanaImpresion.document.write(contenidoHTML);
      ventanaImpresion.document.close();
      
      // Restauramos el filtro después de un tiempo
      setTimeout(() => {
        setFilterOptions(prev => ({
          ...prev,
          soloStockCritico: filtroAnterior
        }));
      }, 500);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      // Convertir valores de string a número
      const insumoData = {
        ...formData,
        stock_actual: parseInt(formData.stock_actual),
        stock_critico: parseInt(formData.stock_critico)
      };

      if (editingInsumo) {
        await insumosService.update(editingInsumo.id, insumoData);
      } else {
        await insumosService.create(insumoData);
      }
      
      setShowForm(false);
      setEditingInsumo(null);
      await cargarInsumos();
      setFormData({
        nombre: '',
        descripcion: '',
        unidad_medida: '',
        stock_actual: '',
        stock_critico: ''
      });
      
      // Mostrar mensaje de éxito
      setAlertMessage(editingInsumo ? 'Insumo actualizado correctamente' : 'Insumo creado correctamente');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      setFormError('Error al guardar el insumo. Por favor, intente nuevamente.');
    }
  };

  const handleEdit = (insumo) => {
    setEditingInsumo(insumo);
    setFormData({
      nombre: insumo.nombre,
      descripcion: insumo.descripcion || '',
      unidad_medida: insumo.unidad_medida,
      stock_actual: insumo.stock_actual.toString(),
      stock_critico: insumo.stock_critico.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este insumo?')) {
      try {
        await insumosService.delete(id);
        await cargarInsumos();
        setAlertMessage('Insumo eliminado correctamente');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (error) {
        console.error('Error al eliminar insumo:', error);
        setAlertMessage('Error al eliminar el insumo');
        setShowAlert(true);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  // Determinar si hay insumos críticos para imprimir
  const hayInsumosCriticos = insumos.some(insumo => insumo.stock_actual <= insumo.stock_critico);

  return (
    <div className="p-6">
      {showAlert && (
        <div className={`mb-4 p-4 ${alertMessage.includes('Error') ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} rounded relative`}>
          <span className="block sm:inline">{alertMessage}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setShowAlert(false)}
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={imprimirListaCompras}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Imprimir lista de compras"
            disabled={!hayInsumosCriticos}
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimir Lista de Compras
          </button>
          <button
            onClick={() => {
              setEditingInsumo(null);
              setFormData({
                nombre: '',
                descripcion: '',
                unidad_medida: '',
                stock_actual: '',
                stock_critico: ''
              });
              setFormError('');
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            aria-label="Agregar nuevo insumo"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Insumo
          </button>
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                <FunnelIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Filtrar</span>
                {filterOptions.soloStockCritico && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-2 px-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Filtros</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="soloStockCritico"
                          name="soloStockCritico"
                          checked={filterOptions.soloStockCritico}
                          onChange={handleFilterChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="soloStockCritico" className="ml-2 text-sm text-gray-700">
                          Mostrar solo stock crítico
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="ordenarPor" className="block text-sm text-gray-700 mb-1">
                          Ordenar por
                        </label>
                        <select
                          id="ordenarPor"
                          name="ordenarPor"
                          value={filterOptions.ordenarPor}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        >
                          <option value="nombre">Nombre</option>
                          <option value="stock_actual">Stock Actual</option>
                          <option value="stock_critico">Faltante (Crítico - Actual)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="ordenDireccion" className="block text-sm text-gray-700 mb-1">
                          Dirección
                        </label>
                        <select
                          id="ordenDireccion"
                          name="ordenDireccion"
                          value={filterOptions.ordenDireccion}
                          onChange={handleFilterChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        >
                          <option value="asc">Ascendente</option>
                          <option value="desc">Descendente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden" id="tabla-insumos">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Crítico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faltante
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {insumosFiltered.length > 0 ? (
              insumosFiltered.map((insumo) => (
                <tr key={insumo.id} className={insumo.stock_actual <= insumo.stock_critico ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{insumo.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.stock_actual}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.stock_critico}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.stock_actual < insumo.stock_critico ? (insumo.stock_critico - insumo.stock_actual) : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(insumo)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(insumo.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  {filterOptions.soloStockCritico 
                    ? 'No hay insumos en stock crítico' 
                    : 'No hay insumos disponibles'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h3>
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                  <input
                    type="text"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_actual}
                      onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Crítico</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_critico}
                      onChange={(e) => setFormData({ ...formData, stock_critico: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingInsumo(null);
                      setFormError('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingInsumo ? 'Actualizar' : 'Guardar'}
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

export default InventarioPage; 