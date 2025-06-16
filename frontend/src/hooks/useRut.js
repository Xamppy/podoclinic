import { useState, useCallback, useEffect } from 'react';
import { pacientesService } from '../api/pacientes';

export const useRut = () => {
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [verificandoExistencia, setVerificandoExistencia] = useState(false);
  const [pacienteExistente, setPacienteExistente] = useState(null);

  const validarRut = useCallback((rut) => {
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }

    const dv = rutLimpio.slice(-1).toUpperCase();
    const rutNumerico = parseInt(rutLimpio.slice(0, -1));
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutNumerico.toString().length - 1; i >= 0; i--) {
      suma += parseInt(rutNumerico.toString()[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dvCalculado === dv;
  }, []);

  const formatearRut = useCallback((rut) => {
    // Eliminar todo excepto números y k
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    
    if (rutLimpio.length <= 1) return rutLimpio;
    
    const dv = rutLimpio.slice(-1).toUpperCase();
    const rutNumerico = rutLimpio.slice(0, -1);
    
    // Formatear con puntos
    const rutFormateado = rutNumerico.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${rutFormateado}-${dv}`;
  }, []);

  const verificarExistenciaRut = useCallback(async (rutFormateado) => {
    if (!rutFormateado || rutFormateado.length < 9) {
      setPacienteExistente(null);
      return;
    }
    
    try {
      setVerificandoExistencia(true);
      const response = await pacientesService.verificarRutExistente(rutFormateado);
      
      if (response.data.existe) {
        setPacienteExistente(response.data.paciente);
        setRutError(`Ya existe un paciente con este RUT: ${response.data.paciente.nombre}`);
      } else {
        setPacienteExistente(null);
        // Solo limpiar el error si no es por formato inválido
        if (rutError && rutError.includes('Ya existe')) {
          setRutError('');
        }
      }
    } catch (error) {
      console.error('Error al verificar existencia del RUT:', error);
      setPacienteExistente(null);
    } finally {
      setVerificandoExistencia(false);
    }
  }, [rutError]);

  const handleRutChange = useCallback((e) => {
    const valor = e.target.value;
    const rutFormateado = formatearRut(valor);
    setRut(rutFormateado);
    setPacienteExistente(null);
    
    if (rutFormateado.length > 0) {
      const esValido = validarRut(rutFormateado);
      if (!esValido) {
        setRutError('RUT inválido');
      } else {
        setRutError('');
        // Verificar existencia solo si el RUT es válido
        verificarExistenciaRut(rutFormateado);
      }
    } else {
      setRutError('');
    }
  }, [formatearRut, validarRut, verificarExistenciaRut]);

  // Efecto para verificar existencia cuando cambia el RUT válido
  useEffect(() => {
    if (rut && validarRut(rut) && !rutError.includes('RUT inválido')) {
      const timeoutId = setTimeout(() => {
        verificarExistenciaRut(rut);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [rut, validarRut, verificarExistenciaRut, rutError]);

  return {
    rut,
    rutError,
    handleRutChange,
    validarRut,
    formatearRut,
    verificandoExistencia,
    pacienteExistente,
    setRut
  };
}; 