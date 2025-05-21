from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import Cita
import logging
import threading
from datetime import datetime

# Configurar el logger
logger = logging.getLogger(__name__)

def enviar_correo_en_segundo_plano(paciente, cita):
    """
    Función que envía un correo en un hilo separado para no bloquear
    """
    try:
        # Convertir fecha y hora a formato legible si vienen como strings
        try:
            if isinstance(cita.fecha, str):
                fecha_obj = datetime.strptime(cita.fecha, '%Y-%m-%d')
                fecha_formateada = fecha_obj.strftime('%d de %B de %Y')
            else:
                fecha_formateada = cita.fecha.strftime('%d de %B de %Y')
                
            if isinstance(cita.hora, str):
                # Si la hora viene como string, extraer solo la parte de la hora
                if ':' in cita.hora:
                    hora_formateada = cita.hora.split(':')[0] + ':' + cita.hora.split(':')[1]
                else:
                    hora_formateada = cita.hora
            else:
                hora_formateada = cita.hora.strftime('%H:%M')
        except Exception as e:
            logger.warning(f"Error al formatear fecha/hora: {str(e)}")
            # Si hay error, usar los valores tal como están
            fecha_formateada = str(cita.fecha)
            hora_formateada = str(cita.hora)
        
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
        
        # Verificar si el correo del paciente existe
        if not paciente.correo:
            logger.error(f"No hay correo registrado para el paciente {paciente.nombre}")
            return
            
        logger.info(f"Enviando correo a: {paciente.correo}")
        
        # Envío directo
        send_mail(
            subject=asunto,
            message=mensaje_texto,
            from_email=settings.EMAIL_FROM,
            recipient_list=[paciente.correo],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Correo de confirmación enviado a {paciente.correo}")
        
    except Exception as e:
        logger.error(f"Error al enviar correo: {str(e)}")

@receiver(post_save, sender=Cita)
def enviar_correo_confirmacion(sender, instance, created, **kwargs):
    """
    Envía un correo electrónico de confirmación cuando se crea una nueva cita
    """
    if created:  # Solo enviar cuando la cita es nueva
        try:
            paciente = instance.paciente
            
            # Verificar que el paciente tenga correo
            if not paciente.correo:
                logger.warning(f"No se puede enviar correo: Paciente {paciente.nombre} no tiene correo registrado")
                return
                
            logger.info(f"Iniciando envío de correo para cita {instance.id} al paciente {paciente.nombre} ({paciente.correo})")
            
            # Iniciar un hilo para enviar el correo en segundo plano
            hilo = threading.Thread(
                target=enviar_correo_en_segundo_plano, 
                args=(paciente, instance)
            )
            hilo.daemon = True  # El hilo se cerrará cuando termine el programa principal
            hilo.start()
            
            logger.info(f"Hilo de envío de correo iniciado para cita {instance.id}")
            
        except Exception as e:
            logger.error(f"Error al iniciar hilo de envío de correo: {str(e)}")
            
            # Intentar enviar directamente si hay error al crear el hilo
            try:
                enviar_correo_en_segundo_plano(instance.paciente, instance)
            except Exception as e2:
                logger.error(f"Error al enviar correo directamente: {str(e2)}") 