from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, TratamientoViewSet, test_email, test_email_paciente, test_email_config
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Cita, Tratamiento
from .serializers import CitaSerializer
from pacientes.models import Paciente
from datetime import datetime

router = DefaultRouter()
router.register(r'citas', CitaViewSet)
router.register(r'tratamientos', TratamientoViewSet)

# Implementación en línea para evitar problemas con el decorador
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_cita_admin_inline(request):
    # Rechazar explícitamente las solicitudes GET
    if request.method != 'POST':
        return Response({'error': 'Solo se permiten solicitudes POST'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    try:
        data = request.data
        
        # Validar los datos necesarios
        required_fields = ['paciente', 'tratamiento', 'fecha', 'hora']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Falta el campo requerido: {field}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el paciente por RUT
        try:
            paciente = Paciente.objects.get(rut=data['paciente'])
        except Paciente.DoesNotExist:
            return Response({'error': f'Paciente con RUT {data["paciente"]} no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar el tratamiento por nombre o usar uno existente
        nombre_tratamiento = data['tratamiento']
        tratamiento = None
        
        # Buscar coincidencia exacta
        for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
            if nombre == nombre_tratamiento:
                tratamiento = Tratamiento.objects.filter(nombre=tipo).first()
                break
        
        # Si no se encontró, crear uno nuevo
        if not tratamiento:
            tipo_tratamiento = 'general'
            for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                if nombre == nombre_tratamiento:
                    tipo_tratamiento = tipo
                    break
            
            tratamiento = Tratamiento.objects.create(
                nombre=tipo_tratamiento,
                descripcion=nombre_tratamiento,
                duracion_minutos=60,
                precio=0
            )
        
        # Verificar si ya existe una cita en esta fecha y hora
        existing_cita = Cita.objects.filter(fecha=data['fecha'], hora=data['hora']).first()
        if existing_cita:
            return Response({'error': f'Ya existe una cita programada para la fecha {data["fecha"]} a las {data["hora"]}. Por favor seleccione otro horario.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear la cita
        cita = Cita.objects.create(
            paciente=paciente,
            tratamiento=tratamiento,
            fecha=data['fecha'],
            hora=data['hora'],
            estado=data.get('estado', 'reservada')
        )
        
        # Devolver la respuesta
        serializer = CitaSerializer(cita)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': f'Error al crear la cita: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([AllowAny])
def actualizar_cita(request, cita_id):
    try:
        # Obtener la cita a actualizar
        try:
            cita = Cita.objects.get(id=cita_id)
        except Cita.DoesNotExist:
            return Response({'error': f'No se encontró una cita con ID {cita_id}'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        
        # Normalizar formato de hora si está presente (eliminar segundos)
        if 'hora' in data and data['hora']:
            hora_str = data['hora']
            if ':' in hora_str:
                partes = hora_str.split(':')
                if len(partes) >= 2:
                    # Usar solo horas y minutos
                    data['hora'] = f"{partes[0]}:{partes[1]}"
        
        # Verificar si hay cambio de fecha/hora y validar disponibilidad
        if ('fecha' in data and 'hora' in data):
            # Solo verificamos si ha cambiado la fecha o la hora
            if (data['fecha'] != str(cita.fecha) or data['hora'] != str(cita.hora).split(':')[:2]):
                # Verificar si ya existe una cita en esta fecha y hora (excluyendo la actual)
                existing_cita = Cita.objects.filter(fecha=data['fecha']).exclude(id=cita_id)
                
                # Comparar horas normalizadas
                for existing in existing_cita:
                    existing_hora = str(existing.hora)
                    if ':' in existing_hora:
                        existing_hora_parts = existing_hora.split(':')
                        existing_hora_norm = f"{existing_hora_parts[0]}:{existing_hora_parts[1]}"
                        
                        if existing_hora_norm == data['hora']:
                            return Response({'error': f'Ya existe una cita programada para la fecha {data["fecha"]} a las {data["hora"]}. Por favor seleccione otro horario.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar paciente si está presente en la solicitud
        if 'paciente' in data:
            try:
                paciente = Paciente.objects.get(rut=data['paciente'])
                cita.paciente = paciente
            except Paciente.DoesNotExist:
                return Response({'error': f'Paciente con RUT {data["paciente"]} no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar tratamiento si está presente en la solicitud
        if 'tratamiento' in data:
            nombre_tratamiento = data['tratamiento']
            tipo_cita = data.get('tipo_cita', 'podologia')
            tratamiento = None
            
            # Buscar coincidencia exacta
            for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                if nombre == nombre_tratamiento:
                    tratamiento = Tratamiento.objects.filter(nombre=tipo).first()
                    break
            
            # Si no se encontró, crear uno nuevo
            if not tratamiento:
                tipo_tratamiento = 'manicura' if tipo_cita == 'manicura' else 'general'
                for tipo, nombre in Tratamiento.TIPOS_TRATAMIENTO:
                    if nombre == nombre_tratamiento:
                        tipo_tratamiento = tipo
                        break
                
                tratamiento = Tratamiento.objects.create(
                    nombre=tipo_tratamiento,
                    descripcion=nombre_tratamiento,
                    duracion_minutos=60,
                    precio=0
                )
            
            cita.tratamiento = tratamiento
        
        # Actualizar otros campos
        if 'fecha' in data:
            cita.fecha = data['fecha']
        
        if 'hora' in data:
            cita.hora = data['hora']
        
        if 'estado' in data:
            cita.estado = data['estado']
            
        if 'tipo_cita' in data:
            cita.tipo_cita = data['tipo_cita']
        
        # Guardar cambios
        cita.save()
        
        # Devolver la respuesta
        serializer = CitaSerializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f'Error al actualizar la cita: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def horarios_disponibles(request):
    try:
        # Obtener la fecha del request o usar la fecha actual como valor predeterminado
        fecha_str = request.query_params.get('fecha')
        
        if fecha_str:
            # Convertir string a objeto date
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = datetime.now().date()
            
        # Filtrar citas por la fecha
        citas = Cita.objects.filter(fecha=fecha)
        
        # Normalizar las horas ocupadas (HH:MM formato)
        horas_ocupadas = set()
        for cita in citas:
            hora_str = str(cita.hora)
            # Extraer solo horas y minutos
            if ':' in hora_str:
                partes = hora_str.split(':')
                if len(partes) >= 2:
                    horas_ocupadas.add(f"{partes[0]}:{partes[1]}")
            else:
                horas_ocupadas.add(hora_str)
        
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

@api_view(['DELETE'])
@permission_classes([AllowAny])
def eliminar_cita(request, cita_id):
    try:
        cita = Cita.objects.get(id=cita_id)
        cita.delete()
        return Response({"message": f"Cita con ID {cita_id} eliminada correctamente"}, status=status.HTTP_200_OK)
    except Cita.DoesNotExist:
        return Response({"error": f"No se encontró una cita con ID {cita_id}"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Error al eliminar la cita: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_citas(request):
    try:
        # Obtener todas las citas
        citas = Cita.objects.all()
        
        # Serializar manualmente para depuración
        resultado = []
        for cita in citas:
            resultado.append({
                'id': cita.id,
                'paciente_id': cita.paciente.id if cita.paciente else None,
                'paciente_rut': cita.paciente.rut if cita.paciente else None,
                'paciente_nombre': cita.paciente.nombre if cita.paciente else None,
                'paciente_fecha_nacimiento': cita.paciente.fecha_nacimiento.isoformat() if cita.paciente and cita.paciente.fecha_nacimiento else None,
                'tratamiento_id': cita.tratamiento.id if cita.tratamiento else None,
                'tratamiento_nombre': cita.tratamiento.get_nombre_display() if cita.tratamiento else None,
                'fecha': cita.fecha,
                'hora': cita.hora,
                'estado': cita.estado,
                'fecha_creacion': cita.fecha_creacion
            })
        
        return Response({
            'total_citas': len(resultado),
            'citas': resultado
        })
    except Exception as e:
        return Response(
            {'error': f'Error al obtener lista de depuración de citas: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

urlpatterns = [
    path('', include(router.urls)),
    path('crear_cita_admin/', crear_cita_admin_inline, name='crear_cita_admin'),
    path('disponibles/', horarios_disponibles, name='horarios_disponibles'),
    path('debug/', debug_citas, name='debug_citas'),
    path('eliminar/<int:cita_id>/', eliminar_cita, name='eliminar_cita'),
    path('actualizar/<int:cita_id>/', actualizar_cita, name='actualizar_cita'),
    path('test-email/', test_email, name='test_email'),
    path('test-email-paciente/', test_email_paciente, name='test_email_paciente'),
    path('test-email-config/', test_email_config, name='test_email_config'),
] 