import requests
from django.conf import settings

def enviar_confirmacion_whatsapp(cita):
    """
    Envía un mensaje de confirmación de cita por WhatsApp
    """
    numero = cita.paciente.telefono
    if not numero.startswith('+'):
        numero = f"+56{numero}"  # Asume números chilenos
        
    mensaje = (
        f"Hola {cita.paciente.nombre}, tu cita para {cita.tratamiento.get_nombre_display()} "
        f"ha sido confirmada para el {cita.fecha.strftime('%d/%m/%Y')} a las "
        f"{cita.hora.strftime('%H:%M')} horas. Por favor confirma respondiendo SI."
    )
    
    # Aquí implementarías la llamada a la API de WhatsApp Business
    # Esto es solo un ejemplo y necesitarás configurar una cuenta de WhatsApp Business
    try:
        response = requests.post(
            f"{settings.WHATSAPP_API_URL}",
            json={
                'phone': numero,
                'message': mensaje
            },
            headers={
                'Authorization': f'Bearer {settings.WHATSAPP_API_TOKEN}'
            }
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error al enviar WhatsApp: {e}")
        return False