from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import time
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Test rápido con Gmail para verificar que el sistema de correo funciona'

    def add_arguments(self, parser):
        parser.add_argument('--to', type=str, required=True, help='Email del destinatario')

    def handle(self, *args, **options):
        email_destino = options['to']
        
        self.stdout.write(self.style.SUCCESS("="*60))
        self.stdout.write(self.style.SUCCESS("🧪 TEST RÁPIDO CON GMAIL"))
        self.stdout.write(self.style.SUCCESS("="*60))
        
        # Guardar configuración actual
        original_host = settings.EMAIL_HOST
        original_user = settings.EMAIL_HOST_USER
        original_password = settings.EMAIL_HOST_PASSWORD
        original_port = settings.EMAIL_PORT
        
        # Configuración temporal de Gmail
        settings.EMAIL_HOST = 'smtp.gmail.com'
        settings.EMAIL_HOST_USER = 'f.orellanalvarez@gmail.com'
        settings.EMAIL_HOST_PASSWORD = 'cvpg pkzt zeso dbpd'
        settings.EMAIL_PORT = 587
        
        self.stdout.write(f"📧 Enviando correo de prueba a: {email_destino}")
        self.stdout.write(f"🌐 Usando Gmail temporalmente para verificar sistema")
        
        try:
            inicio = time.time()
            
            resultado = send_mail(
                subject='✅ Test Sistema de Correo - PodoClinic',
                message=f"""
¡Hola!

Este es un test para verificar que el sistema de correo de PodoClinic funciona.

📊 Detalles del Test:
- Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Sistema: Funcionando correctamente
- Enviado desde: Gmail (configuración temporal)

✅ Si recibes este mensaje, el sistema está listo.

El próximo paso es configurar correctamente Mailgun con:
- postmaster@tu-dominio.com
- API key válido
- Dominio verificado

--
PodoClinic Test Suite
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_destino],
                fail_silently=False,
            )
            
            tiempo = time.time() - inicio
            
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"✅ ¡ÉXITO! Correo enviado en {tiempo:.2f} segundos"))
                self.stdout.write(self.style.SUCCESS("🎉 El sistema de correo funciona perfectamente"))
                self.stdout.write(f"📊 Resultado: {resultado} correo(s) enviado(s)")
                self.stdout.write(f"\n💡 Ahora puedes configurar Mailgun con confianza.")
            else:
                self.stdout.write(self.style.ERROR("❌ ERROR: No se pudo enviar"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERROR: {str(e)}"))
        
        finally:
            # Restaurar configuración original
            settings.EMAIL_HOST = original_host
            settings.EMAIL_HOST_USER = original_user
            settings.EMAIL_HOST_PASSWORD = original_password
            settings.EMAIL_PORT = original_port
            
            self.stdout.write(f"\n🔧 Configuración original restaurada")
            self.stdout.write(f"   HOST: {settings.EMAIL_HOST}")
            self.stdout.write(f"   USER: {settings.EMAIL_HOST_USER}") 