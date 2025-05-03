import React, { useEffect, useState } from 'react';
import { citasService } from '../api/citas';
import { insumosService } from '../api/insumos';

const DashboardPage = () => {
  const [citasHoy, setCitasHoy] = useState([]);
  const [insumosCriticos, setInsumosCriticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError(null);
        const hoy = new Date().toISOString().split('T')[0];
        
        // Cargar citas y insumos en paralelo
        const [citasResponse, insumosResponse] = await Promise.all([
          citasService.getByFecha(hoy),
          insumosService.getStockCritico()
        ]);

        console.log('Respuesta de citas:', citasResponse);
        console.log('Respuesta de insumos críticos:', insumosResponse);
        
        setCitasHoy(Array.isArray(citasResponse.data) ? citasResponse.data : []);
        setInsumosCriticos(insumosResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citas del día */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Citas del Día</h2>
          {citasHoy.length === 0 ? (
            <p className="text-gray-500">No hay citas programadas para hoy</p>
          ) : (
            <ul className="space-y-4">
              {citasHoy.map((cita) => (
                <li key={cita.id} className="border-b pb-2">
                  <p className="font-medium">{cita.paciente_nombre}</p>
                  <p className="text-sm text-gray-600">{cita.hora}</p>
                  <p className="text-sm text-gray-600">{cita.tipo_tratamiento}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Insumos críticos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Insumos con Stock Crítico</h2>
          {insumosCriticos.length === 0 ? (
            <p className="text-gray-500">No hay insumos con stock crítico</p>
          ) : (
            <ul className="space-y-4">
              {insumosCriticos.map((insumo) => (
                <li key={insumo.id} className="border-b pb-2">
                  <p className="font-medium">{insumo.nombre}</p>
                  <p className="text-sm text-red-600">
                    Stock actual: {insumo.stock_actual} {insumo.unidad_medida}
                  </p>
                  <p className="text-sm text-gray-600">
                    Stock crítico: {insumo.stock_critico} {insumo.unidad_medida}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 