from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Cita
from .utils import enviar_confirmacion_whatsapp
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)

@shared_task
def enviar_correo_confirmacion_cita(paciente_id, cita_id):
    """
    Tarea asíncrona para enviar correo de confirmación de cita
    """
    from pacientes.models import Paciente
    from citas.models import Cita
    
    try:
        paciente = Paciente.objects.get(id=paciente_id)
        cita = Cita.objects.get(id=cita_id)
        
        fecha_formateada = cita.fecha.strftime('%d de %B de %Y')
        hora_formateada = cita.hora.strftime('%H:%M')
        
        # Asunto del correo
        asunto = "Confirmación de su Cita - PodoClinic"
        
        # Contexto para la plantilla
        contexto = {
            'nombre_paciente': paciente.nombre,
            'fecha_cita': fecha_formateada,
            'hora_cita': hora_formateada,
            'tipo_cita': cita.get_tipo_cita_display(),
            'nombre_clinica': 'PodoClinic',
            'telefono_clinica': '+56 9 1234 5678',
            'whatsapp_clinica': '+56 9 1234 5678',
            'direccion_clinica': 'Villa El Bosque - Alcalde Sergio Jorquera N°65, La Cruz'
        }
        
        # Renderizar plantillas
        mensaje_html = render_to_string('emails/confirmacion_cita.html', contexto)
        mensaje_texto = render_to_string('emails/confirmacion_cita_texto.txt', contexto)
        
        # Enviar correo
        send_mail(
            subject=asunto,
            message=mensaje_texto,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[paciente.correo],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Correo de confirmación enviado a {paciente.correo} para cita del {fecha_formateada}")
        return f"Correo enviado a {paciente.correo}"
        
    except Exception as e:
        error_msg = f"Error al enviar correo: {str(e)}"
        logger.error(error_msg)
        return error_msg

@shared_task
def enviar_recordatorios_citas():
    """
    Tarea programada para enviar recordatorios de citas próximas
    """
    from citas.models import Cita
    from datetime import date, timedelta
    
    # Buscar citas para mañana que no tengan recordatorio enviado
    fecha_manana = date.today() + timedelta(days=1)
    citas_manana = Cita.objects.filter(
        fecha=fecha_manana,
        recordatorio_enviado=False,
        estado__in=['reservada', 'confirmada']
    )
    
    for cita in citas_manana:
        try:
            enviar_correo_confirmacion_cita.delay(
                paciente_id=cita.paciente.id,
                cita_id=cita.id
            )
            # Marcar que se envió el recordatorio
            cita.recordatorio_enviado = True
            cita.save(update_fields=['recordatorio_enviado'])
            logger.info(f"Recordatorio enviado para cita {cita.id}")
        except Exception as e:
            logger.error(f"Error al enviar recordatorio para cita {cita.id}: {str(e)}")
    
    return f"Procesados {citas_manana.count()} recordatorios"