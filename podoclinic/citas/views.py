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
from django.core.mail import send_mail, EmailMessage, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
import logging
import shutil

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
        
        # Validar los datos necesarios
        required_fields = ['paciente', 'tratamiento', 'fecha', 'hora']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Falta el campo requerido: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Buscar el paciente por RUT
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
        
        # Verificar si ya existe una cita en esta fecha y hora
        existing_cita = Cita.objects.filter(fecha=data['fecha'], hora=data['hora']).first()
        if existing_cita:
            return Response(
                {'error': f'Ya existe una cita programada para la fecha {data["fecha"]} a las {data["hora"]}. Por favor seleccione otro horario.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear la cita con el nuevo campo duracion_cita
        cita = Cita.objects.create(
            paciente=paciente,
            tratamiento=tratamiento,
            fecha=data['fecha'],
            hora=data['hora'],
            estado=data.get('estado', 'reservada'),
            tipo_cita=data.get('tipo_cita', 'podologia'),
            duracion_extendida=data.get('duracion_extendida', False),
            duracion_cita=data.get('duracion_cita', 60)  # Por defecto 60 minutos
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
                tipo_cita=data.get('tipo_cita', 'podologia'),  # Guardar el tipo de cita
                duracion_extendida=data.get('duracion_extendida', False)  # Guardar si la cita requiere 2 horas
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
                
                # La señal post_save se encargará del envío del correo
                
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
            fecha_str = request.query_params.get('fecha')
            tipo_cita = request.query_params.get('tipo_cita', 'podologia')  # Obtener tipo de cita
            
            if fecha_str:
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            else:
                fecha = timezone.now().date()
                
            # Filtrar citas por la fecha Y tipo de cita
            citas = Cita.objects.filter(fecha=fecha, tipo_cita=tipo_cita)
            horas_ocupadas = set()
            
            # Procesar cada cita para marcar las horas ocupadas
            for cita in citas:
                hora_str = f"{cita.hora.hour:02d}:00"
                horas_ocupadas.add(hora_str)
                
                # Si la cita tiene duración extendida, también marcar la siguiente hora como ocupada
                if cita.duracion_extendida:
                    siguiente_hora = f"{(cita.hora.hour + 1):02d}:00"
                    horas_ocupadas.add(siguiente_hora)
            
            # Generar horas disponibles (de 8:00 a 22:00)
            horas_disponibles = []
            for hora in range(8, 23):  # Cambiado para incluir desde las 8:00 hasta las 22:00
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

@api_view(['GET'])
@permission_classes([AllowAny])
def test_email(request):
    """
    Vista para probar el envío de correos electrónicos
    """
    logger = logging.getLogger('citas')
    
    try:
        # Obtener el correo de destino
        email = request.query_params.get('email', 'ejemplo@email.com')
        
        # Contexto para la plantilla
        contexto = {
            'nombre_paciente': 'Usuario de Prueba',
            'fecha_cita': '1 de junio de 2025',
            'hora_cita': '15:30',
            'tipo_cita': 'Podología',
            'nombre_clinica': 'PodoClinic',
            'telefono_clinica': '+56 9 1234 5678',
            'whatsapp_clinica': '+56 9 1234 5678',
            'direccion_clinica': 'Villa El Bosque - Alcalde Sergio Jorquera N°65, La Cruz'
        }
        
        # Renderizar plantillas
        mensaje_html = render_to_string('emails/confirmacion_cita.html', contexto)
        mensaje_texto = render_to_string('emails/confirmacion_cita_texto.txt', contexto)
        
        # Enviar correo
        send_mail(
            subject="Correo de Prueba - PodoClinic",
            message=mensaje_texto,
            from_email=settings.EMAIL_FROM,
            recipient_list=[email],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Correo de prueba enviado a {email}")
        
        return Response({
            'status': 'success',
            'message': f'Correo enviado a {email}',
            'settings': {
                'EMAIL_HOST': settings.EMAIL_HOST,
                'EMAIL_PORT': settings.EMAIL_PORT,
                'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
                'EMAIL_FROM': settings.EMAIL_FROM
            }
        })
        
    except Exception as e:
        logger.error(f"Error al enviar correo de prueba: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error al enviar correo: {str(e)}',
            'settings': {
                'EMAIL_HOST': settings.EMAIL_HOST,
                'EMAIL_PORT': settings.EMAIL_PORT,
                'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
                'EMAIL_FROM': settings.EMAIL_FROM
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_email_paciente(request):
    """
    Vista para probar el envío de correo a un paciente específico por su RUT
    """
    from django.core.mail import send_mail, EmailMultiAlternatives
    from django.conf import settings
    from django.template.loader import render_to_string
    from pacientes.models import Paciente
    import logging
    
    logger = logging.getLogger('citas')
    
    try:
        # Obtener el RUT del paciente de los parámetros de la URL
        rut = request.query_params.get('rut')
        
        # Opción para forzar modo debug (mostrar en consola)
        force_debug = request.query_params.get('debug', 'false').lower() == 'true'
        
        if not rut:
            return Response({
                'status': 'error',
                'message': 'Se requiere el parámetro "rut" para enviar el correo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar el paciente por RUT
        try:
            paciente = Paciente.objects.get(rut=rut)
        except Paciente.DoesNotExist:
            return Response({
                'status': 'error',
                'message': f'No se encontró ningún paciente con el RUT {rut}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar que el paciente tenga correo
        if not paciente.correo:
            return Response({
                'status': 'error',
                'message': f'El paciente {paciente.nombre} no tiene un correo electrónico registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Contexto para la plantilla
        contexto = {
            'nombre_paciente': paciente.nombre,
            'fecha_cita': '1 de junio de 2025',
            'hora_cita': '15:30',
            'tipo_cita': 'Podología',
            'nombre_clinica': 'PodoClinic',
            'telefono_clinica': '+56 9 1234 5678',
            'whatsapp_clinica': '+56 9 1234 5678',
            'direccion_clinica': 'Villa El Bosque - Alcalde Sergio Jorquera N°65, La Cruz'
        }
        
        # Renderizar plantillas
        mensaje_html = render_to_string('emails/confirmacion_cita.html', contexto)
        mensaje_texto = render_to_string('emails/confirmacion_cita_texto.txt', contexto)
        
        logger.info(f"Intentando enviar correo a {paciente.correo}")
        
        # Si se solicita modo debug, usamos console backend
        if force_debug:
            # Guardar el backend actual
            original_backend = settings.EMAIL_BACKEND
            settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
            
            # Enviar correo usando console backend
            send_mail(
                subject="Correo de Prueba para Paciente - PodoClinic (MODO DEBUG)",
                message=mensaje_texto,
                from_email=settings.EMAIL_FROM,
                recipient_list=[paciente.correo],
                html_message=mensaje_html,
                fail_silently=False,
            )
            
            # Restaurar el backend original
            settings.EMAIL_BACKEND = original_backend
            
            logger.info(f"Correo mostrado en consola (modo debug) para: {paciente.correo}")
        else:
            # Enviar correo usando el backend configurado
            try:
                # Envío con más detalles para diagnóstico usando EmailMultiAlternatives
                email = EmailMultiAlternatives(
                    subject="Correo de Prueba para Paciente - PodoClinic",
                    body=mensaje_texto,
                    from_email=settings.EMAIL_FROM,
                    to=[paciente.correo],
                    reply_to=[settings.EMAIL_FROM],
                    headers={'X-PodoClinic-Test': 'True'}
                )
                
                # Agregar la versión HTML como alternativa
                email.attach_alternative(mensaje_html, "text/html")
                
                # Intento de envío con detalles
                logger.info(f"Configuración correo: FROM={settings.EMAIL_FROM}, TO={paciente.correo}")
                result = email.send(fail_silently=False)
                logger.info(f"Resultado de envío: {result}")
            except Exception as e:
                logger.error(f"Error en EmailMessage: {str(e)}")
                # Intento alternativo con send_mail simple
                send_mail(
                    subject="Correo de Prueba para Paciente (alternativo) - PodoClinic",
                    message=mensaje_texto,
                    from_email=settings.EMAIL_FROM,
                    recipient_list=[paciente.correo],
                    html_message=mensaje_html,
                    fail_silently=False,
                )
            
            logger.info(f"Correo de prueba enviado a {paciente.correo} (Paciente: {paciente.nombre})")
        
        # Añadir el correo utilizado en la respuesta para depuración
        email_usado = paciente.correo
        
        return Response({
            'status': 'success',
            'message': f'Correo enviado a {paciente.nombre} ({paciente.correo})',
            'paciente': {
                'rut': paciente.rut,
                'nombre': paciente.nombre,
                'correo': paciente.correo,
                'correo_usado': email_usado
            },
            'settings': {
                'EMAIL_HOST': settings.EMAIL_HOST,
                'EMAIL_PORT': settings.EMAIL_PORT,
                'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
                'EMAIL_FROM': settings.EMAIL_FROM,
                'EMAIL_DEBUG': getattr(settings, 'EMAIL_DEBUG', False),
                'BACKEND': settings.EMAIL_BACKEND
            }
        })
        
    except Exception as e:
        logger.error(f"Error al enviar correo de prueba al paciente: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error al enviar correo: {str(e)}',
            'settings': {
                'EMAIL_HOST': settings.EMAIL_HOST,
                'EMAIL_PORT': settings.EMAIL_PORT,
                'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
                'EMAIL_FROM': settings.EMAIL_FROM
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def actualizar_cita(request, cita_id):
    try:
        # Obtener la cita a actualizar
        try:
            cita = Cita.objects.get(id=cita_id)
        except Cita.DoesNotExist:
            return Response(
                {'error': f'No se encontró una cita con ID {cita_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
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
                            return Response(
                                {'error': f'Ya existe una cita programada para la fecha {data["fecha"]} a las {data["hora"]}. Por favor seleccione otro horario.'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
        
        # Actualizar los campos de la cita
        if 'paciente' in data:
            try:
                paciente = Paciente.objects.get(rut=data['paciente'])
                cita.paciente = paciente
            except Paciente.DoesNotExist:
                return Response(
                    {'error': f'Paciente con RUT {data["paciente"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'tratamiento' in data:
            try:
                nombre_tratamiento = data['tratamiento']
                tipo_cita = data.get('tipo_cita', cita.tipo_cita)
                
                # Buscar primero una coincidencia exacta
                tratamiento = None
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
            except Exception as e:
                return Response(
                    {'error': f'Error al procesar el tratamiento: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Actualizar campos simples
        if 'fecha' in data:
            cita.fecha = data['fecha']
        if 'hora' in data:
            cita.hora = data['hora']
        if 'estado' in data:
            cita.estado = data['estado']
        if 'tipo_cita' in data:
            cita.tipo_cita = data['tipo_cita']
        if 'duracion_extendida' in data:
            cita.duracion_extendida = data['duracion_extendida']
        if 'duracion_cita' in data:
            cita.duracion_cita = data['duracion_cita']
        
        # Guardar los cambios
        cita.save()
        
        # Devolver la respuesta
        serializer = CitaSerializer(cita)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Error al actualizar la cita: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
