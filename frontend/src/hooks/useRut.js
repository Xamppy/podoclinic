import { useState, useCallback } from 'react';

export const useRut = () => {
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');

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

  const handleRutChange = useCallback((e) => {
    const valor = e.target.value;
    const rutFormateado = formatearRut(valor);
    setRut(rutFormateado);
    
    if (rutFormateado.length > 0) {
      const esValido = validarRut(rutFormateado);
      setRutError(esValido ? '' : 'RUT inválido');
    } else {
      setRutError('');
    }
  }, [formatearRut, validarRut]);

  return {
    rut,
    rutError,
    handleRutChange,
    validarRut,
    formatearRut,
    setRut
  };
}; 