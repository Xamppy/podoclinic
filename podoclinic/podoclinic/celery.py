import os
from celery import Celery

# Establecer la variable de entorno Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'podoclinic.settings')

app = Celery('podoclinic')

# Usar configuración de Django para Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# Cargar tareas automáticamente de todas las aplicaciones de Django
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 