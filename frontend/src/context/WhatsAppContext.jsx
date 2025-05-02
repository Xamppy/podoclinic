import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const WhatsAppContext = createContext();

export const WhatsAppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enviarConfirmacionCita = async (cita) => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/notificaciones/whatsapp/confirmacion/', cita);
    } catch (err) {
      setError('Error al enviar la confirmación por WhatsApp');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const enviarRecordatorioCita = async (cita) => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/notificaciones/whatsapp/recordatorio/', cita);
    } catch (err) {
      setError('Error al enviar el recordatorio por WhatsApp');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WhatsAppContext.Provider
      value={{
        loading,
        error,
        enviarConfirmacionCita,
        enviarRecordatorioCita,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp debe ser usado dentro de un WhatsAppProvider');
  }
  return context;
}; 