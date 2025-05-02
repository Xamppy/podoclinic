/**
 * Formatea un RUT en cualquier formato al formato estándar: XX.XXX.XXX-X
 */
export const formatearRut = (rut) => {
    if (!rut) return '';
    
    // Elimina puntos, guiones y espacios
    rut = rut.replace(/[.-]/g, '').replace(/\s/g, '').toUpperCase();
    
    // Separa cuerpo y dígito verificador
    const dv = rut.slice(-1);
    const cuerpo = rut.slice(0, -1).replace(/\D/g, '');
    
    if (cuerpo.length < 1) return '';
    
    // Formatea el cuerpo con puntos
    let rutFormateado = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      rutFormateado = cuerpo.charAt(i) + rutFormateado;
      if ((j + 1) % 3 === 0 && i !== 0) {
        rutFormateado = '.' + rutFormateado;
      }
    }
    
    return `${rutFormateado}-${dv}`;
  };
  
  /**
   * Valida que un RUT chileno sea válido verificando su dígito verificador.
   */
  export const validarRut = (rut) => {
    if (!rut) return false;
    
    // Elimina puntos, guiones y espacios
    rut = rut.replace(/[.-]/g, '').replace(/\s/g, '').toUpperCase();
    
    // Verifica longitud mínima
    if (rut.length < 2) return false;
    
    // Separa cuerpo y dígito verificador
    const dv = rut.slice(-1);
    const cuerpo = rut.slice(0, -1).replace(/\D/g, '');
    
    // Verifica que el cuerpo sean solo números
    if (!cuerpo || isNaN(cuerpo)) return false;
    
    // Calcula dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
    
    // Compara dígito verificador calculado con el proporcionado
    return dv === dvCalculado;
  };