from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Paciente, FichaClinica, UsoProductoEnFicha
from .serializers import PacienteSerializer, FichaClinicaSerializer, UsoProductoEnFichaSerializer

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
        queryset = FichaClinica.objects.all()
        paciente_id = self.request.query_params.get('paciente', None)
        
        if paciente_id is not None:
            try:
                paciente_id = int(paciente_id)
                queryset = queryset.filter(paciente_id=paciente_id)
            except ValueError:
                return FichaClinica.objects.none()
                
        return queryset
    
    def create(self, request, *args, **kwargs):
        print("-------------- CREACIÓN DE FICHA CLÍNICA --------------")
        print("Datos recibidos:", request.data)
        if 'productos_usados' in request.data:
            print(f"Productos usados recibidos ({len(request.data['productos_usados'])}):", request.data['productos_usados'])
        else:
            print("No se recibieron productos usados")
            
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        print("Validando datos...")
        if not serializer.is_valid():
            print("Errores de validación:", serializer.errors)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print("Datos válidos, creando ficha...")
        try:
            self.perform_create(serializer)
            print("Ficha clínica creada correctamente")
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            print("Error al crear ficha:", str(e))
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        print("-------------- ACTUALIZACIÓN DE FICHA CLÍNICA --------------")
        print("Datos de actualización recibidos:", request.data)
        if 'productos_usados' in request.data:
            print(f"Productos usados recibidos ({len(request.data['productos_usados'])}):", request.data['productos_usados'])
        else:
            print("No se recibieron productos usados")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        
        print("Validando datos...")
        if not serializer.is_valid():
            print("Errores de validación:", serializer.errors)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print("Datos válidos, actualizando ficha...")
        try:
            self.perform_update(serializer)
            print("Ficha clínica actualizada correctamente")
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print("Error al actualizar ficha:", str(e))
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )