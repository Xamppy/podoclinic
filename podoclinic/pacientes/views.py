from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Paciente, FichaClinica, UsoProductoEnFicha
from .serializers import PacienteSerializer, FichaClinicaSerializer, UsoProductoEnFichaSerializer
import logging
from django.db import transaction

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