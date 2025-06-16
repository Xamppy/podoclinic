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

@api_view(['DELETE', 'OPTIONS'])
@permission_classes([AllowAny])
def eliminar_paciente_admin(request, rut):
    """
    Vista específica para eliminar pacientes por RUT desde la interfaz de administración.
    No requiere autenticación.
    """
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        response = Response()
        response['Allow'] = 'DELETE, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # Protección para otros métodos no permitidos
    if request.method != 'DELETE':
        return Response(
            {'error': 'Método no permitido. Esta vista solo acepta solicitudes DELETE.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
        
    try:
        print(f"Intentando eliminar paciente con RUT: {rut}")
        
        # Buscar el paciente por RUT
        try:
            paciente = Paciente.objects.get(rut=rut)
        except Paciente.DoesNotExist:
            return Response(
                {'error': f'No se encontró un paciente con el RUT {rut}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Eliminar el paciente
        nombre_paciente = paciente.nombre
        paciente.delete()
        
        return Response(
            {'message': f'Paciente {nombre_paciente} (RUT: {rut}) eliminado exitosamente'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Error al eliminar el paciente: {str(e)}'},
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

@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def verificar_rut_existente(request):
    """
    Vista para verificar si un RUT ya existe en la base de datos.
    Útil para validación en tiempo real en el frontend.
    """
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        response = Response()
        response['Allow'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        rut = request.query_params.get('rut', None)
        
        if not rut:
            return Response(
                {'error': 'El parámetro RUT es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Formatear el RUT usando la función de utils
        from .utils import formatear_rut
        rut_formateado = formatear_rut(rut)
        
        if not rut_formateado:
            return Response(
                {'existe': False, 'rut_valido': False, 'mensaje': 'Formato de RUT inválido'},
                status=status.HTTP_200_OK
            )
        
        # Verificar si existe un paciente con ese RUT
        existe = Paciente.objects.filter(rut=rut_formateado).exists()
        
        if existe:
            # Obtener información básica del paciente existente
            paciente = Paciente.objects.get(rut=rut_formateado)
            return Response({
                'existe': True,
                'rut_valido': True,
                'paciente': {
                    'nombre': paciente.nombre,
                    'rut': paciente.rut,
                    'telefono': paciente.telefono,
                    'correo': paciente.correo
                },
                'mensaje': f'Ya existe un paciente con el RUT {rut_formateado}'
            })
        else:
            return Response({
                'existe': False,
                'rut_valido': True,
                'mensaje': 'RUT disponible'
            })
            
    except Exception as e:
        logger.error(f"Error al verificar RUT existente: {str(e)}")
        return Response(
            {'error': f'Error al verificar el RUT: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )