from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Cita
from .utils import enviar_confirmacion_whatsapp

@shared_task
def enviar_recordatorios_citas():
    """
    Tarea programada para enviar recordatorios de citas al día siguiente
    """
    manana = timezone.now().date() + timedelta(days=1)
    citas_manana = Cita.objects.filter(
        fecha=manana,
        estado='confirmada',
        recordatorio_enviado=False
    )
    
    for cita in citas_manana:
        if enviar_confirmacion_whatsapp(cita):
            cita.recordatorio_enviado = True
            cita.save()
    
    return f"Enviados {citas_manana.count()} recordatorios"