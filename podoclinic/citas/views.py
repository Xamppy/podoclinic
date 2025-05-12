from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters import rest_framework as filters
from django.utils import timezone
from datetime import datetime
from .models import Cita, Tratamiento
from .serializers import CitaSerializer, TratamientoSerializer, ReservaCitaSerializer
from pacientes.models import Paciente

# Vista separada para crear citas desde el admin (sin ViewSet)
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_cita_admin(request):
    """
    Vista específica para crear citas desde la interfaz de administración.
    No requiere autenticación.
    """
    # Protección para método GET
    if request.method == 'GET':
        return Response(
            {'error': 'Método no permitido. Esta vista solo acepta solicitudes POST.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
        
    try:
        data = request.data
        print(f"Datos recibidos en crear_cita_admin: {data}")
        
        # Validar los datos necesarios
        required_fields = ['paciente', 'tratamiento', 'fecha', 'hora']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Falta el campo requerido: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Obtener el paciente por RUT
        try:
            paciente = Paciente.objects.get(rut=data['paciente'])
        except Paciente.DoesNotExist:
            return Response(
                {'error': f'Paciente con RUT {data["paciente"]} no encontrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar el tratamiento por nombre o crear uno si no existe
        try:
            nombre_tratamiento = data['tratamiento']
            tipo_cita = data.get('tipo_cita', 'podologia')
            # Buscar primero una coincidencia exacta con el valor 'nombre'
            tratamiento = None
            for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                if nombre == nombre_tratamiento:
                    tratamiento = Tratamiento.objects.filter(nombre=tipo).first()
                    break
            
            # Si no se encontró, crear un tratamiento nuevo
            if not tratamiento:
                # Buscar un valor apropiado para 'nombre' según el tipo de cita
                tipo_tratamiento = 'manicura' if tipo_cita == 'manicura' else 'general'
                for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                    if nombre == nombre_tratamiento:
                        tipo_tratamiento = tipo
                        break
                
                tratamiento = Tratamiento.objects.create(
                    nombre=tipo_tratamiento,
                    descripcion=nombre_tratamiento,
                    duracion_minutos=60,
                    precio=0  # Precio por defecto
                )
        except Exception as e:
            return Response(
                {'error': f'Error al procesar el tratamiento: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear la cita
        cita = Cita.objects.create(
            paciente=paciente,
            tratamiento=tratamiento,
            fecha=data['fecha'],
            hora=data['hora'],
            estado=data.get('estado', 'reservada'),
            tipo_cita=data.get('tipo_cita', 'podologia')  # Guardar el tipo de cita
        )
        
        # Devolver la respuesta
        serializer = CitaSerializer(cita)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': f'Error al crear la cita: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

# Create your views here.

class CitaFilter(filters.FilterSet):
    fecha = filters.DateFilter(field_name='fecha')
    
    class Meta:
        model = Cita
        fields = ['fecha']

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    filterset_class = CitaFilter
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def crear_admin(self, request):
        """
        Endpoint específico para crear citas desde la interfaz de administración.
        No requiere autenticación para facilitar pruebas.
        """
        try:
            data = request.data
            print(f"Datos recibidos en crear_admin: {data}")
            
            # Validar los datos necesarios
            required_fields = ['paciente', 'tratamiento', 'fecha', 'hora']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Falta el campo requerido: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Obtener el paciente por RUT
            try:
                paciente = Paciente.objects.get(rut=data['paciente'])
            except Paciente.DoesNotExist:
                return Response(
                    {'error': f'Paciente con RUT {data["paciente"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Buscar el tratamiento por nombre o crear uno si no existe
            try:
                nombre_tratamiento = data['tratamiento']
                tipo_cita = data.get('tipo_cita', 'podologia')
                # Buscar primero una coincidencia exacta con el valor 'nombre'
                tratamiento = None
                for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                    if nombre == nombre_tratamiento:
                        tratamiento = Tratamiento.objects.filter(nombre=tipo).first()
                        break
                
                # Si no se encontró, crear un tratamiento nuevo
                if not tratamiento:
                    # Buscar un valor apropiado para 'nombre' según el tipo de cita
                    tipo_tratamiento = 'manicura' if tipo_cita == 'manicura' else 'general'
                    for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                        if nombre == nombre_tratamiento:
                            tipo_tratamiento = tipo
                            break
                    
                    tratamiento = Tratamiento.objects.create(
                        nombre=tipo_tratamiento,
                        descripcion=nombre_tratamiento,
                        duracion_minutos=60,
                        precio=0  # Precio por defecto
                    )
            except Exception as e:
                return Response(
                    {'error': f'Error al procesar el tratamiento: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear la cita
            cita = Cita.objects.create(
                paciente=paciente,
                tratamiento=tratamiento,
                fecha=data['fecha'],
                hora=data['hora'],
                estado=data.get('estado', 'reservada'),
                tipo_cita=data.get('tipo_cita', 'podologia')  # Guardar el tipo de cita
            )
            
            # Devolver la respuesta
            serializer = self.get_serializer(cita)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Error al crear la cita: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def reservar(self, request):
        serializer = ReservaCitaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                cita = serializer.save()
                return Response({
                    'message': 'Cita reservada exitosamente',
                    'cita_id': cita.id
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        try:
            # Obtener la fecha del request o usar la fecha actual como valor predeterminado
            fecha_str = request.query_params.get('fecha')
            
            if fecha_str:
                # Convertir string a objeto date
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            else:
                fecha = timezone.now().date()
                
            # Filtrar citas por la fecha
            citas = Cita.objects.filter(fecha=fecha)
            horas_ocupadas = set(citas.values_list('hora', flat=True))
            
            # Horas disponibles (de 9:00 a 18:00)
            horas_disponibles = []
            for hora in range(9, 19):
                hora_str = f"{hora:02d}:00"
                if hora_str not in horas_ocupadas:
                    horas_disponibles.append(hora_str)
            
            return Response({
                'fecha': fecha,
                'horas_disponibles': horas_disponibles
            })
        except Exception as e:
            return Response(
                {'error': f'Error al obtener horarios disponibles: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
