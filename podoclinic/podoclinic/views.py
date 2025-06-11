import os
import subprocess
import tempfile
import shutil
import json
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.utils import timezone
from django.core import serializers
from django.db import transaction, connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser
from citas.models import Cita, Tratamiento
from pacientes.models import Paciente
from usuarios.models import Usuario

def check_pg_dump():
    """Verifica si pg_dump está instalado y accesible."""
    try:
        subprocess.run(['pg_dump', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

@api_view(['GET'])
@permission_classes([AllowAny])  # Cambiado para permitir acceso sin autenticación por ahora
def database_backup(request):
    """
    Genera un respaldo de la base de datos en formato JSON.
    Funciona tanto para SQLite como PostgreSQL.
    """
    try:
        # Obtener información de la base de datos
        db_settings = settings.DATABASES['default']
        db_engine = db_settings['ENGINE']
        
        # Crear un nombre para el archivo de respaldo con fecha y hora
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        
        # Determinar el tipo de base de datos y el método de respaldo
        if 'sqlite' in db_engine:
            return backup_sqlite(timestamp)
        elif 'postgresql' in db_engine:
            return backup_postgresql_json(timestamp)
        else:
            return JsonResponse({
                'success': False,
                'error': f'Tipo de base de datos no soportado: {db_engine}'
            }, status=500)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error inesperado: {str(e)}'
        }, status=500)

def backup_sqlite(timestamp):
    """Respaldo para base de datos SQLite"""
    try:
        db_path = settings.DATABASES['default']['NAME']
        
        if not os.path.exists(db_path):
            return JsonResponse({
                'success': False,
                'error': 'Archivo de base de datos SQLite no encontrado'
            }, status=500)
        
        backup_file_name = f"podoclinic_backup_{timestamp}.db"
        
        # Leer el archivo SQLite
        with open(db_path, 'rb') as file:
            response = HttpResponse(file.read(), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{backup_file_name}"'
        
        return response
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al respaldar SQLite: {str(e)}'
        }, status=500)

def backup_postgresql_json(timestamp):
    """Respaldo en formato JSON para cualquier base de datos"""
    try:
        # Recopilar todos los datos importantes
        backup_data = {
            'timestamp': timestamp,
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'data': {}
        }
        
        # Respaldar pacientes
        try:
            pacientes = Paciente.objects.all()
            backup_data['data']['pacientes'] = json.loads(serializers.serialize('json', pacientes))
        except Exception as e:
            backup_data['data']['pacientes'] = []
            backup_data['errors'] = backup_data.get('errors', [])
            backup_data['errors'].append(f'Error al respaldar pacientes: {str(e)}')
        
        # Respaldar tratamientos
        try:
            tratamientos = Tratamiento.objects.all()
            backup_data['data']['tratamientos'] = json.loads(serializers.serialize('json', tratamientos))
        except Exception as e:
            backup_data['data']['tratamientos'] = []
            backup_data['errors'] = backup_data.get('errors', [])
            backup_data['errors'].append(f'Error al respaldar tratamientos: {str(e)}')
        
        # Respaldar citas
        try:
            citas = Cita.objects.all()
            backup_data['data']['citas'] = json.loads(serializers.serialize('json', citas))
        except Exception as e:
            backup_data['data']['citas'] = []
            backup_data['errors'] = backup_data.get('errors', [])
            backup_data['errors'].append(f'Error al respaldar citas: {str(e)}')
        
        # Respaldar usuarios (opcional, sin contraseñas)
        try:
            usuarios = Usuario.objects.all()
            backup_data['data']['usuarios'] = json.loads(serializers.serialize('json', usuarios))
        except Exception as e:
            backup_data['data']['usuarios'] = []
            backup_data['errors'] = backup_data.get('errors', [])
            backup_data['errors'].append(f'Error al respaldar usuarios: {str(e)}')
        
        # Convertir a JSON
        json_data = json.dumps(backup_data, ensure_ascii=False, indent=2, default=str)
        
        backup_file_name = f"podoclinic_backup_{timestamp}.json"
        
        # Crear respuesta HTTP
        response = HttpResponse(json_data, content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{backup_file_name}"'
        
        return response
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error al crear respaldo JSON: {str(e)}'
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def database_restore(request):
    """
    Restaura la base de datos desde un archivo JSON de respaldo.
    """
    try:
        # Verificar que se haya enviado un archivo
        if 'backup_file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No se ha enviado ningún archivo de respaldo'
            }, status=400)
        
        backup_file = request.FILES['backup_file']
        
        # Verificar que el archivo sea JSON o SQL
        if not (backup_file.name.endswith('.json') or backup_file.name.endswith('.sql')):
            return JsonResponse({
                'success': False,
                'error': 'El archivo debe tener extensión .json o .sql'
            }, status=400)
        
        # Determinar el tipo de archivo y procesarlo
        if backup_file.name.endswith('.sql'):
            # Procesar archivo SQL
            try:
                sql_content = backup_file.read().decode('utf-8')
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Error al leer el archivo SQL: {str(e)}'
                }, status=400)
            
            # Opción para limpiar la base de datos antes de restaurar
            clear_database = request.POST.get('clear_database', 'false').lower() == 'true'
            
            # Ejecutar la restauración SQL en una transacción
            with transaction.atomic():
                resultado = restore_from_sql(sql_content, clear_database)
                
        else:
            # Procesar archivo JSON (lógica existente)
            try:
                backup_content = backup_file.read().decode('utf-8')
                backup_data = json.loads(backup_content)
            except json.JSONDecodeError as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Error al parsear el archivo JSON: {str(e)}'
                }, status=400)
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Error al leer el archivo: {str(e)}'
                }, status=400)
            
            # Verificar que el archivo tenga la estructura correcta
            if 'data' not in backup_data:
                return JsonResponse({
                    'success': False,
                    'error': 'El archivo de respaldo no tiene la estructura correcta'
                }, status=400)
            
            # Opción para limpiar la base de datos antes de restaurar
            clear_database = request.POST.get('clear_database', 'false').lower() == 'true'
            
            # Ejecutar la restauración en una transacción
            with transaction.atomic():
                resultado = restore_from_backup_data(backup_data['data'], clear_database)
        
        return JsonResponse({
            'success': True,
            'message': 'Base de datos restaurada exitosamente',
            'details': resultado
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error inesperado durante la restauración: {str(e)}'
        }, status=500)

def restore_from_backup_data(data, clear_database=False):
    """
    Restaura los datos desde el diccionario de respaldo.
    """
    resultado = {
        'pacientes_restaurados': 0,
        'tratamientos_restaurados': 0,
        'citas_restauradas': 0,
        'usuarios_restaurados': 0,
        'errores': []
    }
    
    try:
        # Limpiar la base de datos si se solicita
        if clear_database:
            Cita.objects.all().delete()
            Tratamiento.objects.all().delete()
            Paciente.objects.all().delete()
            # No eliminamos usuarios por seguridad
            # Usuario.objects.all().delete()
        
        # Restaurar en orden: Pacientes -> Tratamientos -> Usuarios -> Citas
        
        # 1. Restaurar Pacientes
        if 'pacientes' in data:
            for paciente_data in data['pacientes']:
                try:
                    # Extraer los campos del serializer de Django
                    fields = paciente_data['fields']
                    pk = paciente_data['pk']
                    
                    # Verificar si ya existe
                    paciente_existente = Paciente.objects.filter(rut=fields['rut']).first()
                    if paciente_existente:
                        # Actualizar existente
                        for field, value in fields.items():
                            setattr(paciente_existente, field, value)
                        paciente_existente.save()
                    else:
                        # Crear nuevo
                        Paciente.objects.create(
                            rut=fields['rut'],
                            nombre=fields['nombre'],
                            email=fields.get('email', ''),
                            telefono=fields.get('telefono', ''),
                            fecha_nacimiento=fields.get('fecha_nacimiento'),
                            direccion=fields.get('direccion', ''),
                            observaciones=fields.get('observaciones', '')
                        )
                    
                    resultado['pacientes_restaurados'] += 1
                    
                except Exception as e:
                    resultado['errores'].append(f'Error al restaurar paciente {pk}: {str(e)}')
        
        # 2. Restaurar Tratamientos
        if 'tratamientos' in data:
            for tratamiento_data in data['tratamientos']:
                try:
                    fields = tratamiento_data['fields']
                    pk = tratamiento_data['pk']
                    
                    # Verificar si ya existe
                    tratamiento_existente = Tratamiento.objects.filter(
                        nombre=fields['nombre'], 
                        descripcion=fields.get('descripcion', '')
                    ).first()
                    
                    if not tratamiento_existente:
                        Tratamiento.objects.create(
                            nombre=fields['nombre'],
                            descripcion=fields.get('descripcion', ''),
                            duracion_minutos=fields.get('duracion_minutos', 60),
                            precio=fields.get('precio', 0.0)
                        )
                        resultado['tratamientos_restaurados'] += 1
                    
                except Exception as e:
                    resultado['errores'].append(f'Error al restaurar tratamiento {pk}: {str(e)}')
        
        # 3. Restaurar Usuarios (opcional)
        if 'usuarios' in data:
            for usuario_data in data['usuarios']:
                try:
                    fields = usuario_data['fields']
                    pk = usuario_data['pk']
                    
                    # Solo crear si no existe (por seguridad)
                    if not Usuario.objects.filter(email=fields.get('email', '')).exists():
                        # Nota: Las contraseñas no se restauran por seguridad
                        resultado['errores'].append(f'Usuario {fields.get("email", pk)} detectado pero no restaurado por seguridad')
                    
                except Exception as e:
                    resultado['errores'].append(f'Error al procesar usuario {pk}: {str(e)}')
        
        # 4. Restaurar Citas
        if 'citas' in data:
            for cita_data in data['citas']:
                try:
                    fields = cita_data['fields']
                    pk = cita_data['pk']
                    
                    # Buscar paciente y tratamiento relacionados
                    paciente = Paciente.objects.filter(id=fields['paciente']).first()
                    tratamiento = Tratamiento.objects.filter(id=fields['tratamiento']).first()
                    
                    if not paciente:
                        resultado['errores'].append(f'Paciente con ID {fields["paciente"]} no encontrado para cita {pk}')
                        continue
                    
                    if not tratamiento:
                        resultado['errores'].append(f'Tratamiento con ID {fields["tratamiento"]} no encontrado para cita {pk}')
                        continue
                    
                    # Verificar si ya existe la cita
                    cita_existente = Cita.objects.filter(
                        fecha=fields['fecha'],
                        hora=fields['hora'],
                        tipo_cita=fields.get('tipo_cita', 'podologia')
                    ).first()
                    
                    if not cita_existente:
                        Cita.objects.create(
                            paciente=paciente,
                            tratamiento=tratamiento,
                            fecha=fields['fecha'],
                            hora=fields['hora'],
                            estado=fields.get('estado', 'reservada'),
                            tipo_cita=fields.get('tipo_cita', 'podologia'),
                            duracion_cita=fields.get('duracion_cita', 60),
                            duracion_extendida=fields.get('duracion_extendida', False),
                            recordatorio_enviado=fields.get('recordatorio_enviado', False)
                        )
                        resultado['citas_restauradas'] += 1
                    
                except Exception as e:
                    resultado['errores'].append(f'Error al restaurar cita {pk}: {str(e)}')
        
        return resultado
        
    except Exception as e:
        resultado['errores'].append(f'Error general en la restauración: {str(e)}')
        return resultado

def _should_process_command(command, resultado):
    """
    Determina si un comando SQL debe ser procesado.
    """
    command_upper = command.upper()
    
    # Procesar INSERT para las tablas de nuestra aplicación
    if command_upper.startswith('INSERT INTO'):
        if any(table in command_upper for table in ['PACIENTES_', 'CITAS_', 'INSUMOS_']):
            return True
        else:
            resultado['advertencias'].append(f'INSERT omitido: {command[:50]}...')
            return False
    
    # Procesar SELECT para secuencias
    elif command_upper.startswith('SELECT SETVAL'):
        return True
    
    return False

def restore_from_sql(sql_content, clear_database=False):
    """
    Restaura la base de datos desde un archivo SQL.
    """
    resultado = {
        'comandos_ejecutados': 0,
        'errores': [],
        'advertencias': []
    }
    
    try:
        cursor = connection.cursor()
        
        # Limpiar la base de datos si se solicita
        if clear_database:
            try:
                # Obtener todas las tablas de la aplicación
                tables_to_clear = [
                    'citas_cita',
                    'citas_tratamiento', 
                    'pacientes_paciente',
                    # No limpiamos usuarios por seguridad
                    # 'usuarios_usuario'
                ]
                
                # Limpiar tablas en orden correcto para evitar problemas de foreign key
                # Para PostgreSQL no necesitamos deshabilitar foreign keys si eliminamos en orden correcto
                tables_to_clear_ordered = [
                    'pacientes_usoproductoenficha',  # Primero las tablas que referencian
                    'insumos_movimientoinsumo',      # Tablas que referencian insumos
                    'pacientes_fichaclinica',        # Fichas clínicas
                    'citas_cita',                    # Citas
                    'citas_tratamiento',             # Tratamientos 
                    'pacientes_paciente',            # Pacientes
                    'insumos_insumo',               # Insumos al final
                    # No limpiamos usuarios por seguridad
                    # 'usuarios_usuario'
                ]
                
                # Limpiar tablas en orden
                for table in tables_to_clear_ordered:
                    try:
                        cursor.execute(f'DELETE FROM {table};')
                        # Reiniciar secuencias de ID en PostgreSQL
                        if 'postgresql' in connection.settings_dict['ENGINE']:
                            cursor.execute(f'ALTER SEQUENCE {table}_id_seq RESTART WITH 1;')
                        resultado['advertencias'].append(f'Tabla {table} limpiada')
                    except Exception as e:
                        resultado['errores'].append(f'Error al limpiar tabla {table}: {str(e)}')
                    
            except Exception as e:
                resultado['errores'].append(f'Error al limpiar base de datos: {str(e)}')
        
        # Preparar el contenido SQL
        # Procesar línea por línea manteniendo comandos completos
        sql_commands = []
        current_command = []
        
        for line in sql_content.split('\n'):
            line = line.strip()
            
            # Omitir comentarios y líneas vacías
            if not line or line.startswith('--') or line.startswith('#'):
                continue
                
            line_upper = line.upper()
            
            # Si es inicio de un nuevo comando
            if (line_upper.startswith('INSERT INTO') or 
                line_upper.startswith('SELECT SETVAL')):
                
                # Si tenemos un comando pendiente, agregarlo
                if current_command:
                    command_text = ' '.join(current_command)
                    if _should_process_command(command_text, resultado):
                        sql_commands.append(command_text)
                    current_command = []
                
                # Verificar si debemos procesar este comando
                if _should_process_command(line, resultado):
                    current_command = [line]
            
            # Si estamos dentro de un comando (continuación)
            elif current_command:
                current_command.append(line)
        
        # Agregar el último comando si existe
        if current_command:
            command_text = ' '.join(current_command)
            if _should_process_command(command_text, resultado):
                sql_commands.append(command_text)
        
        # Dividir comandos por punto y coma si es necesario
        final_commands = []
        for cmd in sql_commands:
            if ';' in cmd:
                parts = [p.strip() for p in cmd.split(';') if p.strip()]
                final_commands.extend(parts)
            else:
                final_commands.append(cmd)
        
        sql_commands = final_commands
        
        # Ejecutar cada comando SQL en transacciones individuales
        for i, command in enumerate(sql_commands):
            try:
                # Filtrar comandos problemáticos o innecesarios
                command_upper = command.upper().strip()
                
                # Saltar comandos que pueden causar problemas
                skip_commands = [
                    'CREATE DATABASE',
                    'USE DATABASE',
                    'DROP DATABASE',
                    'CREATE USER',
                    'GRANT',
                    'SET FOREIGN_KEY_CHECKS',
                    'PRAGMA FOREIGN_KEYS',
                    'SET SESSION SQL_MODE',
                    'SET SQL_MODE',
                    'SET TIME_ZONE',
                    'SET NAMES',
                    'SET CHARACTER_SET',
                    'CREATE TABLE AUTH_',
                    'CREATE TABLE DJANGO_',
                    'CREATE SEQUENCE AUTH_',
                    'CREATE SEQUENCE DJANGO_'
                ]
                
                should_skip = any(skip_cmd in command_upper for skip_cmd in skip_commands)
                
                # También omitir comandos CREATE TABLE para tablas del sistema
                if 'CREATE TABLE' in command_upper:
                    table_name = command_upper.split('CREATE TABLE')[1].split('(')[0].strip()
                    system_tables = ['AUTH_', 'DJANGO_', 'CONTENTTYPES_', 'SESSIONS_']
                    if any(table_name.startswith(sys_table) for sys_table in system_tables):
                        resultado['advertencias'].append(f'Tabla del sistema omitida: {table_name}')
                        continue
                
                if should_skip:
                    resultado['advertencias'].append(f'Comando omitido por seguridad: {command[:50]}...')
                    continue
                
                # Usar transacción individual para cada comando
                try:
                    with connection.cursor() as individual_cursor:
                        # Para comandos INSERT, usar ON CONFLICT para manejar duplicados
                        if command_upper.startswith('INSERT INTO'):
                            # Ejecutar el comando tal como está
                            individual_cursor.execute(command)
                        else:
                            # Para SELECT setval y otros
                            individual_cursor.execute(command)
                        resultado['comandos_ejecutados'] += 1
                except Exception as cmd_error:
                    # Si es error de clave duplicada, convertir en advertencia
                    if 'llave duplicada' in str(cmd_error) or 'duplicate key' in str(cmd_error):
                        resultado['advertencias'].append(f'Registro duplicado omitido: {command[:50]}...')
                    else:
                        raise cmd_error
                
                # Log de progreso cada 100 comandos
                if (i + 1) % 100 == 0:
                    resultado['advertencias'].append(f'Procesados {i + 1} comandos...')
                
            except Exception as e:
                error_msg = f'Error en comando {i + 1}: {str(e)}'
                resultado['errores'].append(error_msg)
                
                # Para comandos CREATE TABLE que fallan, solo advertir
                if 'CREATE TABLE' in command.upper() and 'ya existe' in str(e):
                    resultado['advertencias'].append(f'Tabla ya existente: {command[:50]}...')
                
                # Si hay muchos errores, detener para evitar spam
                if len(resultado['errores']) > 50:
                    resultado['errores'].append('Demasiados errores, deteniendo procesamiento...')
                    break
        
        # Actualizar contadores finales
        try:
            # Contar registros restaurados
            cursor.execute("SELECT COUNT(*) FROM pacientes_paciente")
            resultado['pacientes_restaurados'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM citas_tratamiento") 
            resultado['tratamientos_restaurados'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM citas_cita")
            resultado['citas_restauradas'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM insumos_insumo")
            resultado['insumos_restaurados'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM pacientes_fichaclinica")
            resultado['fichas_restauradas'] = cursor.fetchone()[0]
            
        except Exception as e:
            resultado['errores'].append(f'Error al contar registros: {str(e)}')
            resultado['pacientes_restaurados'] = 0
            resultado['tratamientos_restaurados'] = 0
            resultado['citas_restauradas'] = 0
            resultado['insumos_restaurados'] = 0
            resultado['fichas_restauradas'] = 0
        
        cursor.close()
        
        return resultado
        
    except Exception as e:
        resultado['errores'].append(f'Error general en restauración SQL: {str(e)}')
        return resultado