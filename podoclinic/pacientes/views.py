from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Paciente, FichaClinica
from .serializers import PacienteSerializer, FichaClinicaSerializer

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
    
    def get_queryset(self):
        queryset = FichaClinica.objects.all()
        paciente_id = self.request.query_params.get('paciente', None)
        
        print(f"Buscando fichas para paciente_id: {paciente_id}")
        
        if paciente_id is not None:
            try:
                paciente_id = int(paciente_id)
                queryset = queryset.filter(paciente_id=paciente_id)
                print(f"Fichas encontradas: {queryset.count()}")
            except ValueError:
                print(f"Error: paciente_id no es un número válido: {paciente_id}")
                return FichaClinica.objects.none()
                
        return queryset