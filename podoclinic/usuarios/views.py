from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario
from .serializers import UsuarioSerializer
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create your views here.

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

def enviar_correo_login(usuario):
    """
    Envía un correo de notificación cuando un usuario inicia sesión
    """
    try:
        # Contexto para la plantilla
        contexto = {
            'nombre_usuario': f"{usuario.first_name} {usuario.last_name}".strip(),
            'fecha_login': datetime.now().strftime('%d de %B de %Y %H:%M'),
            'nombre_clinica': 'Clínica Podológica Esmeralda',
            'direccion_clinica': 'Villa El Bosque - Alcalde Sergio Jorquera N°65, La Cruz'
        }
        
        # Renderizar plantillas
        mensaje_html = render_to_string('emails/notificacion_login.html', contexto)
        mensaje_texto = render_to_string('emails/notificacion_login_texto.txt', contexto)
        
        # Enviar correo
        send_mail(
            subject="Notificación de Inicio de Sesión - Clínica Podológica Esmeralda",
            message=mensaje_texto,
            from_email=settings.EMAIL_FROM,
            recipient_list=[usuario.email],
            html_message=mensaje_html,
            fail_silently=False,
        )
        
        logger.info(f"Correo de notificación de login enviado a {usuario.email}")
        
    except Exception as e:
        logger.error(f"Error al enviar correo de notificación de login: {str(e)}")

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        
        # Enviar correo de notificación
        enviar_correo_login(user)
        
        return Response({
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol
            }
        })
    else:
        return Response({'error': 'Credenciales inválidas'}, status=400)
