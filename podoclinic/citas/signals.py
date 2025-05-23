from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from .models import Cita
import logging
import threading
import os
from datetime import datetime
from email.mime.image import MIMEImage

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
        asunto = "Confirmación de su Cita - Clínica Podológica Esmeralda"
        
        # Contexto para la plantilla
        contexto = {
            'nombre_paciente': paciente.nombre,
            'fecha_cita': fecha_formateada,
            'hora_cita': hora_formateada,
            'tipo_cita': cita.tratamiento.get_nombre_display() if hasattr(cita, 'tratamiento') and cita.tratamiento else cita.get_tipo_cita_display(),
            'nombre_clinica': 'Clínica Podológica Esmeralda',
            'telefono_clinica': '+56 9 8543 3364',
            'whatsapp_clinica': '+56 9 8543 3364',
            'direccion_clinica': 'Villa El Bosque - Alcalde Sergio Jorquera N°65, La Cruz'
        }
        
        # Verificar si el correo del paciente existe
        if not paciente.correo:
            logger.error(f"No hay correo registrado para el paciente {paciente.nombre}")
            return
            
        logger.info(f"Enviando correo a: {paciente.correo}")

        # Buscar el logo en varias ubicaciones posibles
        posibles_rutas = [
            os.path.join(settings.BASE_DIR, 'frontend', 'public', 'logo-podoclinic.png'),
            os.path.join(settings.BASE_DIR, 'staticfiles', 'logo-podoclinic.png'),
            os.path.join(settings.BASE_DIR, 'static', 'images', 'logo-podoclinic.png'),
            os.path.join(settings.BASE_DIR, 'static', 'logo-podoclinic.png'),
            os.path.join(settings.BASE_DIR, 'media', 'logo-podoclinic.png'),
            # Ruta absoluta como opción adicional
            r'C:\Users\Usuario\Desktop\Podoclinic\frontend\public\logo-podoclinic.png'
        ]
        
        logo_path = None
        for ruta in posibles_rutas:
            if os.path.exists(ruta):
                logo_path = ruta
                logger.info(f"Logo encontrado en: {logo_path}")
                break
                
        if not logo_path:
            logger.warning("No se encontró el logo en ninguna ubicación conocida")
        
        # Leer contenido del logo si existe
        logo_data = None
        if logo_path:
            try:
                with open(logo_path, 'rb') as img_file:
                    logo_data = img_file.read()
                    logger.info(f"Logo leído correctamente desde {logo_path}")
            except Exception as e:
                logger.error(f"Error al leer el logo: {str(e)}")
        
        # Crear el mensaje de correo electrónico base
        email = EmailMultiAlternatives(
            subject=asunto,
            body=render_to_string('emails/confirmacion_cita_texto.txt', contexto),
            from_email=settings.EMAIL_FROM,
            to=[paciente.correo]
        )
        
        # Crear la versión HTML
        html_content = render_to_string('emails/confirmacion_cita.html', contexto)
        
        # Generar un Content-ID único para el logo
        logo_content_id = 'logo@podoclinic.clinica.esmeralda'
        
        # Si se pudo leer el logo, adjuntarlo con el ID correcto
        if logo_data:
            try:
                # Crear la imagen MIME
                img = MIMEImage(logo_data)
                # El Content-ID debe estar entre < > para cumplir con RFC 2392
                img.add_header('Content-ID', f'<{logo_content_id}>')
                # Es importante configurar el content-disposition como inline
                img.add_header('Content-Disposition', 'inline', filename='logo-podoclinic.png')
                
                # Reemplazar la referencia en el HTML para asegurar compatibilidad
                html_content = html_content.replace('cid:logo', f'cid:{logo_content_id}')
                
                # Adjuntar primero la imagen antes del HTML
                email.attach(img)
                logger.info("Logo adjuntado correctamente al correo")
            except Exception as e:
                logger.error(f"Error al adjuntar el logo: {str(e)}")
        
        # Adjuntar la versión HTML
        email.attach_alternative(html_content, "text/html")
        
        # Asegurar que se use la subclase correcta para contenido mixto
        email.mixed_subtype = 'related'
        
        # Enviar el correo
        try:
            email.send(fail_silently=False)
            logger.info(f"Correo de confirmación enviado a {paciente.correo}")
        except Exception as e:
            logger.error(f"Error al enviar el correo: {str(e)}")
            # Intentar enviar sin HTML si falla
            try:
                send_mail(
                    subject=asunto,
                    message=render_to_string('emails/confirmacion_cita_texto.txt', contexto),
                    from_email=settings.EMAIL_FROM,
                    recipient_list=[paciente.correo],
                    fail_silently=False,
                )
                logger.info(f"Correo de texto plano enviado a {paciente.correo}")
            except Exception as e2:
                logger.error(f"Error al enviar correo de texto plano: {str(e2)}")
                raise
        
    except Exception as e:
        logger.error(f"Error al enviar correo: {str(e)}")
        raise

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