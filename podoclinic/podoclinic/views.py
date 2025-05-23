import os
import subprocess
import tempfile
import shutil
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser

def check_pg_dump():
    """Verifica si pg_dump está instalado y accesible."""
    try:
        subprocess.run(['pg_dump', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

@api_view(['GET'])
@permission_classes([IsAdminUser])
def database_backup(request):
    """
    Genera un respaldo de la base de datos PostgreSQL y lo ofrece para descargar.
    Solo usuarios autenticados pueden acceder a esta funcionalidad.
    """
    # Verificar si pg_dump está instalado
    if not check_pg_dump():
        return JsonResponse({
            'success': False,
            'error': 'pg_dump no está instalado o no está en el PATH del sistema'
        }, status=500)

    try:
        # Obtener información de la base de datos desde settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_password = db_settings['PASSWORD']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']

        # Verificar que tenemos todas las credenciales necesarias
        if not all([db_name, db_user, db_host, db_port]):
            return JsonResponse({
                'success': False,
                'error': 'Faltan credenciales de la base de datos en la configuración'
            }, status=500)

        # Crear un nombre para el archivo de respaldo con fecha y hora
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_file_name = f"podoclinic_backup_{timestamp}.sql"
        
        # Crear un directorio temporal para el respaldo
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, backup_file_name)
        
        try:
            # Configurar las variables de entorno para pg_dump
            env = os.environ.copy()
            if db_password:
                env['PGPASSWORD'] = db_password
            
            # Construir el comando pg_dump
            command = [
                'pg_dump',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '-f', temp_file_path,
                '--format=p',  # Formato plain (sql)
                '--no-owner',  # No incluir comandos para configurar el propietario
                '--no-acl'     # No incluir comandos para configurar privilegios de acceso
            ]
            
            # Ejecutar pg_dump
            process = subprocess.Popen(
                command,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()
            
            # Verificar si pg_dump ejecutó correctamente
            if process.returncode != 0:
                error_message = stderr.decode('utf-8') if stderr else "Error desconocido al generar el respaldo"
                return JsonResponse({
                    'success': False,
                    'error': f'Error al ejecutar pg_dump: {error_message}'
                }, status=500)
            
            # Verificar que el archivo se creó correctamente
            if not os.path.exists(temp_file_path):
                return JsonResponse({
                    'success': False,
                    'error': 'No se pudo crear el archivo de respaldo'
                }, status=500)
            
            # Leer el archivo generado
            with open(temp_file_path, 'rb') as file:
                response = HttpResponse(file.read(), content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{backup_file_name}"'
            
            return response
            
        finally:
            # Limpiar el directorio temporal
            shutil.rmtree(temp_dir, ignore_errors=True)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error inesperado: {str(e)}'
        }, status=500) 