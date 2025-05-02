def formatear_rut(rut):
    """
    Formatea un RUT en cualquier formato al formato estándar: XX.XXX.XXX-X
    """
    # Elimina puntos, guiones y espacios
    rut = rut.replace(".", "").replace("-", "").replace(" ", "").upper()
    
    # Separa cuerpo y dígito verificador
    cuerpo = rut[:-1]
    dv = rut[-1]
    
    # Formatea el cuerpo con puntos
    if len(cuerpo) == 7:
        cuerpo_fmt = f"{cuerpo[0]}.{cuerpo[1:4]}.{cuerpo[4:]}"
    elif len(cuerpo) == 8:
        cuerpo_fmt = f"{cuerpo[:2]}.{cuerpo[2:5]}.{cuerpo[5:]}"
    else:
        return None  # RUT inválido
    
    # Retorna RUT formateado
    return f"{cuerpo_fmt}-{dv}"

def validar_rut(rut):
    """
    Valida que un RUT chileno sea válido verificando su dígito verificador.
    """
    # Elimina puntos, guiones y espacios
    rut = rut.replace(".", "").replace("-", "").replace(" ", "").upper()
    
    # Verifica longitud mínima
    if len(rut) < 2:
        return False
    
    # Separa cuerpo y dígito verificador
    cuerpo = rut[:-1]
    dv = rut[-1]
    
    # Verifica que el cuerpo sean solo números
    if not cuerpo.isdigit():
        return False
    
    # Calcula dígito verificador
    suma = 0
    multiplicador = 2
    
    for d in reversed(cuerpo):
        suma += int(d) * multiplicador
        multiplicador += 1
        if multiplicador > 7:
            multiplicador = 2
    
    resto = suma % 11
    dv_calculado = 11 - resto
    
    if dv_calculado == 11:
        dv_calculado = '0'
    elif dv_calculado == 10:
        dv_calculado = 'K'
    else:
        dv_calculado = str(dv_calculado)
    
    # Compara dígito verificador calculado con el proporcionado
    return dv == dv_calculado