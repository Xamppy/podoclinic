import React, { useState } from 'react';
import { databaseService } from '../api/database';

const RespaldoPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleGenerarRespaldo = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Llamar al endpoint para generar el respaldo
      const response = await databaseService.generateBackup();

      // Obtener el nombre del archivo de las cabeceras de respuesta
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'backup.sql';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      // Crear un objeto URL para el archivo descargado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear un enlace temporal y hacer clic en él para iniciar la descarga
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar después de la descarga
      window.URL.revokeObjectURL(url);
      link.remove();
      
      setSuccess(true);
    } catch (err) {
      console.error('Error al generar respaldo:', err);
      setError('Error al generar el respaldo de la base de datos. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Respaldo de Base de Datos</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Generar Copia de Seguridad</h2>
        
        <p className="mb-6 text-xl leading-relaxed">
          Desde esta sección puede generar una copia de seguridad completa de todos los datos de Clínica Podológica Esmeralda.
          El archivo generado puede guardarse donde usted prefiera: escritorio, disco externo o pendrive.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-lg text-blue-800">
                Este proceso puede tardar algunos segundos.
                Por favor, no cierre ni actualice esta página durante la generación del respaldo.
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-lg text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-5 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-lg text-green-800">
                  ¡Copia de seguridad creada correctamente! 
                  El archivo se ha descargado a su computadora.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleGenerarRespaldo}
          disabled={loading}
          className={`px-8 py-4 text-xl font-medium rounded-md text-white 
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
            transition-colors w-full flex justify-center items-center`}
          aria-label="Generar respaldo de base de datos"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando copia de seguridad...
            </>
          ) : (
            <>
              <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Crear Copia de Seguridad
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RespaldoPage; 