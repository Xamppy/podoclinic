import axiosInstance from './axios';

export const databaseService = {
  /**
   * Genera un respaldo completo de la base de datos y lo descarga
   * @returns {Promise} Respuesta en formato blob para descargar
   */
  generateBackup: () => {
    return axiosInstance.get('/database/backup/', {
      responseType: 'blob'
    });
  },


}; 