from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Paciente, FichaClinica, UsoProductoEnFicha
from .serializers import PacienteSerializer, FichaClinicaSerializer, UsoProductoEnFichaSerializer
import logging
from django.db import transaction, connection
import json
import io
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core import serializers
from django.apps import apps
from django.contrib.auth.decorators import login_required

logger = logging.getLogger(__name__)

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def crear_paciente_admin(request):
    """
    Vista específica para crear pacientes desde la interfaz de administración.
    No requiere autenticación.
    """
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        response = Response()
        response['Allow'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # Protección para otros métodos no permitidos
    if request.method != 'POST':
        return Response(
            {'error': 'Método no permitido. Esta vista solo acepta solicitudes POST.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
        
    try:
        data = request.data
        print(f"Datos recibidos en crear_paciente_admin: {data}")
        
        # Validar los datos necesarios
        required_fields = ['rut', 'nombre', 'telefono', 'correo']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Falta el campo requerido: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verificar si ya existe un paciente con ese RUT
        if Paciente.objects.filter(rut=data['rut']).exists():
            return Response(
                {'error': f'Ya existe un paciente con el RUT {data["rut"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear el paciente
        serializer = PacienteSerializer(data=data)
        if serializer.is_valid():
            paciente = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {'error': f'Error al crear el paciente: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PUT', 'OPTIONS'])
@permission_classes([AllowAny])
def actualizar_paciente_admin(request):
    """
    Vista específica para actualizar pacientes desde la interfaz de administración.
    No requiere autenticación.
    """
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        response = Response()
        response['Allow'] = 'PUT, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'PUT, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # Protección para otros métodos no permitidos
    if request.method != 'PUT':
        return Response(
            {'error': 'Método no permitido. Esta vista solo acepta solicitudes PUT.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
        
    try:
        data = request.data
        print(f"Datos recibidos en actualizar_paciente_admin: {data}")
        
        # Validar que se proporcione el RUT
        if 'rut' not in data:
            return Response(
                {'error': 'Falta el RUT del paciente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar los datos necesarios
        required_fields = ['nombre', 'telefono', 'correo']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response(
                {'error': f'Faltan los siguientes campos requeridos: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar el paciente por RUT
        try:
            paciente = Paciente.objects.get(rut=data['rut'])
        except Paciente.DoesNotExist:
            return Response(
                {'error': f'No se encontró un paciente con el RUT {data["rut"]}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Preparar los datos para la actualización
        datos_actualizados = data.copy()
        
        # Manejar fecha_nacimiento
        if 'fecha_nacimiento' in datos_actualizados:
            if datos_actualizados['fecha_nacimiento'] == '' or datos_actualizados['fecha_nacimiento'] is None:
                datos_actualizados['fecha_nacimiento'] = None
        
        # Actualizar el paciente
        serializer = PacienteSerializer(paciente, data=datos_actualizados, partial=True)
        if serializer.is_valid():
            paciente = serializer.save()
            return Response(serializer.data)
        else:
            print(f"Errores de validación: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Error al actualizar el paciente: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    
    def get_queryset(self):
        queryset = Paciente.objects.all()
        rut = self.request.query_params.get('rut', None)
        
        if rut is not None:
            from .utils import formatear_rut
            rut_formateado = formatear_rut(rut)
            if rut_formateado:
                queryset = queryset.filter(rut=rut_formateado)
                
        return queryset

class FichaClinicaViewSet(viewsets.ModelViewSet):
    queryset = FichaClinica.objects.all()
    serializer_class = FichaClinicaSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        try:
            logger.info("Iniciando get_queryset en FichaClinicaViewSet")
            queryset = FichaClinica.objects.all()
            
            # Primero obtenemos las fichas sin los productos
            paciente_id = self.request.query_params.get('paciente', None)
            logger.info(f"Parámetro paciente_id recibido: {paciente_id}")
            
            if paciente_id is not None:
                try:
                    paciente_id = int(paciente_id)
                    queryset = queryset.filter(paciente_id=paciente_id)
                    logger.info(f"Filtrado por paciente_id: {paciente_id}")
                except ValueError:
                    logger.error(f"ID de paciente inválido: {paciente_id}")
                    return FichaClinica.objects.none()
            
            # Luego hacemos el prefetch_related
            queryset = queryset.prefetch_related(
                'productos_usados',
                'productos_usados__insumo'
            )
            
            logger.info(f"Número de fichas encontradas: {queryset.count()}")
            return queryset
            
        except Exception as e:
            logger.error(f"Error en get_queryset: {str(e)}", exc_info=True)
            return FichaClinica.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            logger.info("Iniciando list en FichaClinicaViewSet")
            queryset = self.get_queryset()
            
            # Verificar si el queryset está vacío
            if not queryset.exists():
                logger.info("No se encontraron fichas clínicas")
                return Response([], status=status.HTTP_200_OK)
            
            # Serializar los datos con manejo de errores
            try:
                serializer = self.get_serializer(queryset, many=True)
                data = serializer.data
                logger.info(f"Datos serializados correctamente. Número de fichas: {len(data)}")
                return Response(data)
            except Exception as e:
                logger.error(f"Error al serializar datos: {str(e)}", exc_info=True)
                raise
                
        except Exception as e:
            logger.error(f"Error en list: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Error al obtener las fichas clínicas', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            logger.info("Iniciando create en FichaClinicaViewSet")
            logger.info(f"Datos recibidos: {request.data}")
            
            serializer = self.get_serializer(data=request.data, context={'request': request})
            
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                ficha = serializer.save()
                ficha.calcular_costo_total()
                logger.info(f"Ficha creada correctamente. ID: {ficha.id}")
            
            return Response(
                self.get_serializer(ficha).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error en create: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Error al crear la ficha clínica', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        try:
            logger.info("Iniciando update en FichaClinicaViewSet")
            logger.info(f"Datos recibidos: {request.data}")
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                logger.error(f"Errores de validación: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                ficha = serializer.save()
                ficha.calcular_costo_total()
                logger.info(f"Ficha actualizada correctamente. ID: {ficha.id}")
            
            return Response(self.get_serializer(ficha).data)
        except Exception as e:
            logger.error(f"Error en update: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Error al actualizar la ficha clínica', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def backup_database(request):
    """
    Genera un backup completo de la base de datos en formato SQL
    """
    try:
        # Obtener todos los modelos de la aplicación
        models_to_backup = [
            'usuarios.Usuario',
            'pacientes.Paciente', 
            'pacientes.FichaClinica',
            'pacientes.UsoProductoEnFicha',
            'citas.Tratamiento',
            'citas.Cita',
            'insumos.Insumo',
            'insumos.MovimientoInsumo',
        ]
        
        # Crear el contenido SQL
        sql_content = _generate_sql_backup(models_to_backup)
        
        # Crear la respuesta HTTP con el archivo SQL
        response = HttpResponse(sql_content, content_type='application/sql')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'podoclinic_backup_{timestamp}.sql'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        logger.info(f"Backup generado exitosamente: {filename}")
        return response
        
    except Exception as e:
        logger.error(f"Error al generar backup: {str(e)}")
        return JsonResponse({
            'error': f'Error al generar backup: {str(e)}'
        }, status=500)

def _generate_sql_backup(models_to_backup):
    """
    Genera un backup SQL con formato COPY para restauración directa
    """
    sql_lines = [
        "-- Script para restaurar datos específicos en una base de datos existente.",
        "-- ADVERTENCIA: Este script borrará los datos actuales de las tablas listadas.",
        "",
        "-- 1. Limpiar los datos existentes de las tablas relacionadas",
        "-- Se usa TRUNCATE por ser más rápido para borrar todas las filas.",
        "-- RESTART IDENTITY reinicia los contadores de ID.",
        "-- CASCADE se encarga de las tablas relacionadas por llaves foráneas.",
        "TRUNCATE",
    ]
    
    # Lista de tablas a limpiar (en orden correcto)
    table_order = [
        'citas.Tratamiento',
        'pacientes.Paciente', 
        'insumos.Insumo'
    ]
    
    table_names = []
    for model_name in table_order:
        if model_name in models_to_backup:
            app_label, model_class_name = model_name.split('.')
            model_class = apps.get_model(app_label, model_class_name)
            table_names.append(f"    public.{model_class._meta.db_table}")
    
    sql_lines.append(',\n'.join(table_names))
    sql_lines.extend([
        "RESTART IDENTITY CASCADE;",
        "",
        "-- 2. Copiar los datos del respaldo a las tablas limpias",
        ""
    ])
    
    # Generar comandos COPY para cada modelo en orden específico
    model_order = [
        'citas.Tratamiento',
        'insumos.Insumo', 
        'insumos.MovimientoInsumo',
        'pacientes.Paciente',
        'citas.Cita',
        'pacientes.FichaClinica',
        'pacientes.UsoProductoEnFicha'
    ]
    
    for model_name in model_order:
        if model_name in models_to_backup:
            try:
                app_label, model_class_name = model_name.split('.')
                model_class = apps.get_model(app_label, model_class_name)
                table_name = model_class._meta.db_table
                objects = model_class.objects.all()
                
                if objects.exists():
                    # Obtener nombres de columnas
                    field_names = []
                    for field in model_class._meta.fields:
                        field_names.append(field.column)
                    
                    # Determinar descripción del modelo
                    model_description = {
                        'citas.Tratamiento': 'citas_tratamiento',
                        'insumos.Insumo': 'insumos_insumo (Stock)',
                        'insumos.MovimientoInsumo': 'insumos_movimientoinsumo (Movimientos de Stock)',
                        'pacientes.Paciente': 'pacientes_paciente',
                        'citas.Cita': 'citas_cita',
                        'pacientes.FichaClinica': 'pacientes_fichaclinica',
                        'pacientes.UsoProductoEnFicha': 'pacientes_usoproductoenficha (Uso de productos en fichas)'
                    }.get(model_name, model_name)
                    
                    sql_lines.extend([
                        f"-- Datos para: {model_description}",
                        f"COPY public.{table_name} ({', '.join(field_names)}) FROM stdin;"
                    ])
                    
                    # Generar datos en formato COPY (separados por tabs)
                    for obj in objects:
                        values = []
                        for field in model_class._meta.fields:
                            field_value = getattr(obj, field.name)
                            
                            if field_value is None:
                                values.append('\\N')
                            elif isinstance(field_value, bool):
                                values.append('t' if field_value else 'f')
                            elif isinstance(field_value, str):
                                # Escapar caracteres especiales para COPY
                                escaped_value = field_value.replace('\\', '\\\\').replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r')
                                values.append(escaped_value)
                            elif hasattr(field_value, 'isoformat'):  # datetime, date, time
                                values.append(field_value.isoformat())
                            else:
                                values.append(str(field_value))
                        
                        sql_lines.append('\t'.join(values))
                    
                    sql_lines.extend([
                        "\\.",
                        ""
                    ])
                    
            except Exception as e:
                sql_lines.extend([
                    f"-- Error al procesar {model_name}: {str(e)}",
                    ""
                ])
    
    return '\n'.join(sql_lines)

def _generate_insert_sql(obj, table_name):
    """
    Genera una declaración INSERT SQL para un objeto
    """
    fields = []
    values = []
    
    for field in obj._meta.fields:
        field_name = field.column
        field_value = getattr(obj, field.name)
        
        fields.append(f'"{field_name}"')
        
        if field_value is None:
            values.append('NULL')
        elif isinstance(field_value, str):
            # Escapar comillas simples
            escaped_value = field_value.replace("'", "''")
            values.append(f"'{escaped_value}'")
        elif isinstance(field_value, (int, float)):
            values.append(str(field_value))
        elif isinstance(field_value, bool):
            values.append('true' if field_value else 'false')
        elif hasattr(field_value, 'isoformat'):  # datetime, date, time
            values.append(f"'{field_value.isoformat()}'")
        else:
            values.append(f"'{str(field_value)}'")
    
    fields_str = ', '.join(fields)
    values_str = ', '.join(values)
    
    return f'INSERT INTO "{table_name}" ({fields_str}) VALUES ({values_str});'





# Funciones de restauración eliminadas - Solo se mantiene la funcionalidad de backup
    """
    Restaura desde archivo SQL
    """
    try:
        # Intentar múltiples codificaciones para manejar caracteres especiales
        content = None
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'ascii']
        
        for encoding in encodings_to_try:
            try:
                backup_file.seek(0)  # Volver al inicio del archivo
                content = backup_file.read().decode(encoding)
                print(f"Archivo decodificado exitosamente con codificación: {encoding}")
                break
            except UnicodeDecodeError as e:
                print(f"Error con codificación {encoding}: {str(e)}")
                continue
        
        # Si ninguna codificación funcionó, usar 'replace' para caracteres problemáticos
        if content is None:
            backup_file.seek(0)
            content = backup_file.read().decode('utf-8', errors='replace')
            print("Usando UTF-8 con reemplazo de caracteres problemáticos")
        
        # Limpiar caracteres problemáticos adicionales
        content = content.replace('\x00', '')  # Remover caracteres nulos
        content = content.replace('\ufeff', '')  # Remover BOM si existe
        
        result = {
            'comandos_ejecutados': 0,
            'pacientes_restaurados': 0,
            'tratamientos_restaurados': 0,
            'citas_restauradas': 0,
            'advertencias': [],
            'errores': []
        }
        
        # Si no se va a limpiar la base de datos, solo ejecutar INSERTs
        if not clear_database:
            return _restore_sql_data_only(content, result)
        
        if clear_database:
            _clear_database_tables()
        
        # Ejecutar comandos SQL sin transacción atómica grande
        with connection.cursor() as cursor:
            # Procesar línea por línea para filtrar mejor
            lines = content.split('\n')
            current_command = []
            
            for line in lines:
                line = line.strip()
                
                # Saltar líneas vacías
                if not line:
                    continue
                
                # Saltar comentarios que empiezan con --
                if line.startswith('--'):
                    continue
                
                # Saltar metadatos de pg_dump
                if (line.startswith('Type:') or 
                    line.startswith('Schema:') or 
                    line.startswith('Owner:') or
                    line.startswith('\\.')):
                    continue
                
                # Saltar comandos de configuración que pueden causar problemas
                if (line.startswith('SET ') or
                    line.startswith('SELECT pg_catalog.') or
                    line.startswith('\\connect')):
                    continue
                
                # Acumular líneas del comando actual
                current_command.append(line)
                
                # Si la línea termina con ;, ejecutar el comando
                if line.endswith(';'):
                    command = ' '.join(current_command).strip()
                    current_command = []
                    
                    # Procesar el comando
                    if command:
                        _execute_sql_command_safe(cursor, command, result)
            
            # Ejecutar comando pendiente si existe
            if current_command:
                command = ' '.join(current_command).strip()
                if command:
                    _execute_sql_command_safe(cursor, command, result)
            
            # Contar registros restaurados
            try:
                from .models import Paciente
                from citas.models import Tratamiento, Cita
                
                result['pacientes_restaurados'] = Paciente.objects.count()
                result['tratamientos_restaurados'] = Tratamiento.objects.count()
                result['citas_restauradas'] = Cita.objects.count()
            except Exception as e:
                result['advertencias'].append(f"No se pudo contar registros: {str(e)}")
        
        return result
        
    except Exception as e:
        raise Exception(f"Error al procesar archivo SQL: {str(e)}")

def _restore_sql_data_only(content, result):
    """
    Restaura solo los datos (INSERTs) desde un archivo SQL, ignorando estructura
    """
    with transaction.atomic():
        with connection.cursor() as cursor:
            # Procesar línea por línea buscando solo INSERTs
            lines = content.split('\n')
            current_command = []
            in_copy_block = False
            
            for line in lines:
                line = line.strip()
                
                # Saltar líneas vacías y comentarios
                if not line or line.startswith('--'):
                    continue
                
                # Detectar inicio de bloque COPY y saltarlo
                if line.upper().startswith('COPY'):
                    in_copy_block = True
                    result['advertencias'].append(f"Comando COPY ignorado (no compatible): {line[:50]}...")
                    continue
                
                # Detectar fin de bloque COPY
                if in_copy_block and line == '\\.':
                    in_copy_block = False
                    continue
                
                # Saltar contenido dentro de bloque COPY
                if in_copy_block:
                    continue
                
                # Acumular líneas del comando actual
                current_command.append(line)
                
                # Si la línea termina con ;, procesar el comando
                if line.endswith(';'):
                    command = ' '.join(current_command).strip()
                    current_command = []
                    
                    # Solo ejecutar comandos INSERT
                    if command.upper().startswith('INSERT'):
                        try:
                            cursor.execute(command)
                            result['comandos_ejecutados'] += 1
                        except Exception as e:
                            # Para INSERTs, los errores de duplicados son esperables
                            if 'duplicate key' in str(e).lower() or 'already exists' in str(e).lower():
                                result['advertencias'].append(f"Registro duplicado ignorado: {str(e)}")
                            else:
                                result['errores'].append(f"Error ejecutando INSERT: {str(e)}")
        
        # Contar registros restaurados
        try:
            from .models import Paciente
            from citas.models import Tratamiento, Cita
            
            result['pacientes_restaurados'] = Paciente.objects.count()
            result['tratamientos_restaurados'] = Tratamiento.objects.count()
            result['citas_restauradas'] = Cita.objects.count()
        except Exception as e:
            result['advertencias'].append(f"No se pudo contar registros: {str(e)}")
    
    return result

def _execute_sql_command_safe(cursor, command, result):
    """
    Ejecuta un comando SQL individual en su propia transacción con manejo de errores mejorado
    """
    command_upper = command.upper()
    
    # Saltar comandos COPY ya que no son compatibles con Django
    if command_upper.startswith('COPY'):
        result['advertencias'].append(f"Comando COPY ignorado (no compatible): {command[:50]}...")
        return
    
    # Solo ejecutar comandos relevantes
    if not (command_upper.startswith('INSERT') or
            command_upper.startswith('UPDATE') or
            command_upper.startswith('DELETE') or
            command_upper.startswith('CREATE') or
            command_upper.startswith('ALTER') or
            command_upper.startswith('SELECT')):
        result['advertencias'].append(f"Comando no permitido saltado: {command[:50]}...")
        return
    
    # Usar savepoint para cada comando individual
    try:
        with transaction.atomic():
            # Modificar CREATE TABLE para usar IF NOT EXISTS solo si no lo tiene ya
            if command_upper.startswith('CREATE TABLE') and 'IF NOT EXISTS' not in command_upper:
                command = command.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', 1)
            
            # Modificar CREATE SEQUENCE para usar IF NOT EXISTS solo si no lo tiene ya
            elif command_upper.startswith('CREATE SEQUENCE') and 'IF NOT EXISTS' not in command_upper:
                command = command.replace('CREATE SEQUENCE', 'CREATE SEQUENCE IF NOT EXISTS', 1)
            
            # Modificar CREATE INDEX para usar IF NOT EXISTS solo si no lo tiene ya
            elif command_upper.startswith('CREATE INDEX') and 'IF NOT EXISTS' not in command_upper:
                command = command.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS', 1)
            
            # Para comandos INSERT, agregar ON CONFLICT DO NOTHING para evitar errores de duplicados
            elif command_upper.startswith('INSERT INTO'):
                if 'ON CONFLICT' not in command_upper:
                    command = command.rstrip(';') + ' ON CONFLICT DO NOTHING;'
            
            cursor.execute(command)
            result['comandos_ejecutados'] += 1
            
    except Exception as e:
        error_msg = str(e).lower()
        
        # Clasificar errores: algunos son esperables y no críticos
        if any(phrase in error_msg for phrase in [
            'ya existe', 'already exists', 'duplicate key', 
            'violates unique constraint', 'relation already exists'
        ]):
            # Estos son errores esperables cuando no se limpia la BD
            result['advertencias'].append(f"Elemento ya existe (saltado): {str(e)}")
        else:
            # Otros errores son más serios
            result['errores'].append(f"Error ejecutando comando SQL: {str(e)}")
            print(f"Error SQL: {str(e)}")
            print(f"Comando: {command[:100]}...")

def _execute_sql_command(cursor, command, result):
    """
    Ejecuta un comando SQL individual con manejo de errores mejorado
    """
    command_upper = command.upper()
    
    # Saltar comandos COPY ya que no son compatibles con Django
    if command_upper.startswith('COPY'):
        result['advertencias'].append(f"Comando COPY ignorado (no compatible): {command[:50]}...")
        return
    
    # Modificar CREATE TABLE para usar IF NOT EXISTS solo si no lo tiene ya
    if command_upper.startswith('CREATE TABLE') and 'IF NOT EXISTS' not in command_upper:
        command = command.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', 1)
    
    # Modificar CREATE SEQUENCE para usar IF NOT EXISTS solo si no lo tiene ya
    elif command_upper.startswith('CREATE SEQUENCE') and 'IF NOT EXISTS' not in command_upper:
        command = command.replace('CREATE SEQUENCE', 'CREATE SEQUENCE IF NOT EXISTS', 1)
    
    # Solo ejecutar comandos relevantes
    if (command_upper.startswith('INSERT') or
        command_upper.startswith('UPDATE') or
        command_upper.startswith('DELETE') or
        command_upper.startswith('CREATE') or
        command_upper.startswith('ALTER')):
        
        try:
            cursor.execute(command)
            result['comandos_ejecutados'] += 1
        except Exception as e:
            error_msg = str(e).lower()
            
            # Manejar errores comunes de manera más elegante
            if ('already exists' in error_msg or 
                'duplicate key' in error_msg or
                'relation already exists' in error_msg):
                result['advertencias'].append(f"Elemento ya existe (ignorado): {str(e)}")
            else:
                result['errores'].append(f"Error ejecutando comando SQL: {str(e)}")

def _clear_database_tables():
    """
    Limpia las tablas principales de la base de datos
    """
    with connection.cursor() as cursor:
        # Desactivar restricciones de clave foránea temporalmente
        cursor.execute("SET session_replication_role = replica;")
        
        # Lista de tablas a limpiar (en orden para evitar conflictos de FK)
        tables_to_clear = [
            'pacientes_usoproductoenficha',
            'pacientes_fichaclinica',
            'citas_cita',
            'insumos_movimientoinsumo',
            'pacientes_paciente',
            'citas_tratamiento',
            'insumos_insumo',
        ]
        
        for table in tables_to_clear:
            try:
                cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
            except Exception as e:
                logger.warning(f"No se pudo limpiar tabla {table}: {str(e)}")
        
        # Reactivar restricciones de clave foránea
        cursor.execute("SET session_replication_role = DEFAULT;")