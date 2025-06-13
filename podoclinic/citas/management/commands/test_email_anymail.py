from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import time
from datetime import datetime

class Command(BaseCommand):
    help = 'Test de envío de correo usando Anymail con Mailgun API'

    def add_arguments(self, parser):
        parser.add_argument('--to', type=str, required=True, help='Email del destinatario')
        parser.add_argument('--verbose', action='store_true', help='Mostrar información detallada')

    def handle(self, *args, **options):
        email_destino = options['to']
        verbose = options['verbose']
        
        self.stdout.write(self.style.SUCCESS("="*60))
        self.stdout.write(self.style.SUCCESS("🧪 TEST DE ANYMAIL + MAILGUN API"))
        self.stdout.write(self.style.SUCCESS("="*60))
        
        # Mostrar configuración
        self.stdout.write(f"\n📋 CONFIGURACIÓN ANYMAIL:")
        self.stdout.write(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        if hasattr(settings, 'ANYMAIL'):
            anymail_config = settings.ANYMAIL
            self.stdout.write(f"   MAILGUN_API_KEY: {'SET' if anymail_config.get('MAILGUN_API_KEY') else 'NOT SET'}")
            self.stdout.write(f"   MAILGUN_SENDER_DOMAIN: {anymail_config.get('MAILGUN_SENDER_DOMAIN', 'NOT SET')}")
            self.stdout.write(f"   MAILGUN_API_URL: {anymail_config.get('MAILGUN_API_URL', 'NOT SET')}")
        else:
            self.stdout.write(self.style.ERROR("   ❌ ANYMAIL no configurado en settings"))
            return
        
        self.stdout.write(f"\n📧 Destinatario: {email_destino}")
        self.stdout.write(f"⏰ Fecha/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            self.stdout.write(f"\n🚀 Enviando correo con Anymail...")
            inicio = time.time()
            
            # Crear email con Anymail
            email = EmailMultiAlternatives(
                subject='✅ Test Anymail + Mailgun API - PodoClinic',
                body=f"""
¡Hola!

Este es un correo de prueba enviado usando Anymail con la API de Mailgun.

✅ Ventajas de usar Anymail + API:
- Sin problemas de conexión SMTP
- Más rápido y confiable
- Mejor manejo de errores
- Estadísticas detalladas

📊 Detalles del Test:
- Enviado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Backend: {settings.EMAIL_BACKEND}
- Remitente: {settings.DEFAULT_FROM_EMAIL}
- Método: Mailgun API (no SMTP)

¡Tu configuración con Anymail está funcionando perfectamente! 🎉

--
PodoClinic Test Suite (Anymail)
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_destino]
            )
            
            # Agregar versión HTML
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">✅ Test Anymail + Mailgun API</h2>
                <p>¡Hola!</p>
                <p>Este es un correo de prueba enviado usando <strong>Anymail</strong> con la <strong>API de Mailgun</strong>.</p>
                
                <h3 style="color: #007bff;">✅ Ventajas de usar Anymail + API:</h3>
                <ul>
                    <li>Sin problemas de conexión SMTP</li>
                    <li>Más rápido y confiable</li>
                    <li>Mejor manejo de errores</li>
                    <li>Estadísticas detalladas</li>
                </ul>
                
                <h3 style="color: #6c757d;">📊 Detalles del Test:</h3>
                <ul>
                    <li><strong>Enviado:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                    <li><strong>Backend:</strong> {settings.EMAIL_BACKEND}</li>
                    <li><strong>Remitente:</strong> {settings.DEFAULT_FROM_EMAIL}</li>
                    <li><strong>Método:</strong> Mailgun API (no SMTP)</li>
                </ul>
                
                <p style="margin-top: 30px; color: #28a745; font-weight: bold;">
                    ¡Tu configuración con Anymail está funcionando perfectamente! 🎉
                </p>
                
                <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                    --<br>
                    PodoClinic Test Suite (Anymail)
                </p>
            </body>
            </html>
            """
            
            email.attach_alternative(html_content, "text/html")
            
            # Enviar
            resultado = email.send(fail_silently=False)
            tiempo_transcurrido = time.time() - inicio
            
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"\n✅ ¡ÉXITO! Correo enviado en {tiempo_transcurrido:.2f} segundos"))
                self.stdout.write(f"📊 Resultado: {resultado} correo(s) enviado(s)")
                self.stdout.write(f"\n🎉 Anymail + Mailgun API funcionando perfectamente!")
                
                if verbose:
                    self.stdout.write(f"\n📝 Detalles adicionales:")
                    self.stdout.write(f"   - Método: API HTTP (no SMTP)")
                    self.stdout.write(f"   - Sin problemas de conexión")
                    self.stdout.write(f"   - Más robusto que SMTP")
                    
            else:
                self.stdout.write(self.style.ERROR("❌ ERROR: No se pudo enviar el correo"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ ERROR: {str(e)}"))
            if verbose:
                import traceback
                self.stdout.write(f"\n🔍 Traceback completo:")
                self.stdout.write(traceback.format_exc())
            
            self.stdout.write(f"\n💡 Posibles soluciones:")
            self.stdout.write(f"   1. Verifica tu MAILGUN_API_KEY en .env")
            self.stdout.write(f"   2. Confirma que el dominio esté verificado en Mailgun")
            self.stdout.write(f"   3. Revisa que 'anymail' esté en INSTALLED_APPS")
            
        self.stdout.write(f"\n" + "="*60) 