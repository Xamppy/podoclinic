import React, { useEffect, useState } from 'react';
import { citasService } from '../api/citas';
import { insumosService } from '../api/insumos';
import axiosInstance from '../api/axios';
import { format, differenceInYears } from 'date-fns';
import es from 'date-fns/locale/es';
import { formatInTimeZone } from 'date-fns-tz';

const DashboardPage = () => {
  const [citasHoy, setCitasHoy] = useState([]);
  const [insumosCriticos, setInsumosCriticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError(null);
        
        // Obtener la fecha actual en la zona horaria de Chile
        const timeZone = 'America/Santiago';
        const hoy = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
        console.log('Fecha en Chile:', hoy);
        
        // Cargar citas usando el endpoint de depuración y insumos en paralelo
        const [citasResponse, insumosResponse] = await Promise.all([
          axiosInstance.get('/citas/debug/'),
          insumosService.getStockCritico()
        ]);

        console.log('Respuesta completa de citas:', citasResponse.data);
        console.log('Estructura de la primera cita:', citasResponse.data.citas?.[0]);
        
        // Filtrar las citas para hoy y ordenarlas por hora
        let citasData = [];
        if (citasResponse.data && citasResponse.data.citas) {
          citasData = citasResponse.data.citas
            .filter(cita => {
              try {
                // Comparar directamente las fechas en formato string YYYY-MM-DD
                console.log('Comparando fechas:', {
                  fecha_cita: cita.fecha,
                  fecha_chile: hoy,
                  sonIguales: cita.fecha === hoy
                });
                return cita.fecha === hoy;
              } catch (error) {
                console.error('Error procesando fecha de cita:', cita.fecha, error);
                return false;
              }
            })
            .map(cita => ({
              ...cita,
              hora: cita.hora.substring(0, 5), // Formato HH:MM
              tipo_tratamiento: cita.tratamiento_nombre || cita.tipo_tratamiento || 'Sin especificar',
              estado_color: getEstadoColor(cita.estado)
            }))
            .sort((a, b) => a.hora.localeCompare(b.hora));
        }

        console.log('Citas de hoy procesadas:', citasData);
        setCitasHoy(citasData);
        setInsumosCriticos(insumosResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    // Actualizar los datos cada 5 minutos
    const intervalo = setInterval(cargarDatos, 5 * 60 * 1000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalo);
  }, []);

  // Función para obtener el color según el estado de la cita
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Función para formatear la fecha
  const formatearFecha = (fecha) => {
    return format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es });
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const fechaNac = new Date(fechaNacimiento);
    const edad = differenceInYears(new Date(), fechaNac);
    return edad;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citas del día */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Citas del Día</h2>
            <p className="text-sm text-gray-600 capitalize">
              {formatearFecha(new Date())}
            </p>
          </div>
          
          {citasHoy.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500">No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {citasHoy.map((cita) => (
                <div 
                  key={cita.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{cita.paciente_nombre}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${cita.estado_color}`}>
                      {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Hora:</span> {cita.hora}
                    </p>
                    {cita.paciente_fecha_nacimiento && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Edad:</span> {calcularEdad(cita.paciente_fecha_nacimiento)} años
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tratamiento:</span> {cita.tipo_tratamiento}
                    </p>
                    {cita.tipo_cita && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tipo:</span> {cita.tipo_cita === 'podologia' ? 'Podología' : 'Manicura'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insumos críticos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Insumos con Stock Crítico</h2>
          {insumosCriticos.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500">No hay insumos con stock crítico</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insumosCriticos.map((insumo) => (
                <div 
                  key={insumo.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{insumo.nombre}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-red-600">
                      Stock actual: {insumo.stock_actual} {insumo.unidad_medida}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock crítico: {insumo.stock_critico} {insumo.unidad_medida}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 