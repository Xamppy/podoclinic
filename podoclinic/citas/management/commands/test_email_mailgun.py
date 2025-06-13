from django.core.management.base import BaseCommand
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
import time
import logging
from datetime import datetime
import os

class Command(BaseCommand):
    help = 'Envía un correo de prueba usando Mailgun con monitoreo detallado'

    def add_arguments(self, parser):
        parser.add_argument('--to', type=str, required=True, help='Email del destinatario')
        parser.add_argument('--test-type', type=str, choices=['simple', 'html', 'complete'], 
                          default='complete', help='Tipo de prueba a realizar')
        parser.add_argument('--verbose', action='store_true', help='Mostrar información detallada')

    def handle(self, *args, **options):
        email_destino = options['to']
        test_type = options['test_type']
        verbose = options['verbose']
        
        # Configurar logging
        if verbose:
            logging.basicConfig(level=logging.DEBUG)
        
        self.stdout.write(self.style.SUCCESS("="*60))
        self.stdout.write(self.style.SUCCESS("🧪 TEST DE ENVÍO DE CORREO - MAILGUN"))
        self.stdout.write(self.style.SUCCESS("="*60))
        
        # Mostrar configuración actual
        self.mostrar_configuracion()
        
        # Mostrar información del test
        self.stdout.write(f"\n📧 Destinatario: {email_destino}")
        self.stdout.write(f"🔧 Tipo de test: {test_type}")
        self.stdout.write(f"⏰ Fecha/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Ejecutar el test correspondiente
        if test_type == 'simple':
            self.test_simple(email_destino)
        elif test_type == 'html':
            self.test_html(email_destino)
        else:
            self.test_complete(email_destino)

    def mostrar_configuracion(self):
        """Muestra la configuración actual de email"""
        self.stdout.write(f"\n📋 CONFIGURACIÓN ACTUAL:")
        self.stdout.write(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
        self.stdout.write(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        self.stdout.write(f"   EMAIL_HOST_PASSWORD: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
        self.stdout.write(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        
        # Verificar variables de entorno
        self.stdout.write(f"\n🔧 VARIABLES DE ENTORNO:")
        self.stdout.write(f"   EMAIL_HOST: {os.environ.get('EMAIL_HOST', 'NO SET')}")
        self.stdout.write(f"   EMAIL_HOST_USER: {os.environ.get('EMAIL_HOST_USER', 'NO SET')}")
        self.stdout.write(f"   EMAIL_HOST_PASSWORD: {'SET' if os.environ.get('EMAIL_HOST_PASSWORD') else 'NO SET'}")

    def test_simple(self, email_destino):
        """Test simple con send_mail"""
        self.stdout.write(f"\n🟡 INICIANDO TEST SIMPLE...")
        
        try:
            inicio = time.time()
            
            resultado = send_mail(
                subject='[TEST SIMPLE] Prueba de Mailgun - PodoClinic',
                message='Este es un correo de prueba simple desde PodoClinic usando Mailgun.\n\nSi recibes este mensaje, la configuración SMTP está funcionando correctamente.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_destino],
                fail_silently=False,
            )
            
            tiempo_transcurrido = time.time() - inicio
            
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"✅ ÉXITO: Correo enviado en {tiempo_transcurrido:.2f} segundos"))
                self.stdout.write(f"   📊 Resultado: {resultado} correo(s) enviado(s)")
            else:
                self.stdout.write(self.style.ERROR("❌ ERROR: No se pudo enviar el correo"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERROR: {str(e)}"))

    def test_html(self, email_destino):
        """Test con HTML usando EmailMultiAlternatives"""
        self.stdout.write(f"\n🟠 INICIANDO TEST HTML...")
        
        try:
            inicio = time.time()
            
            # Crear contenido HTML
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test Mailgun - PodoClinic</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h1 style="color: #2c3e50;">🧪 Test de Mailgun - PodoClinic</h1>
                    <p>Este es un correo de prueba <strong>con formato HTML</strong> enviado desde PodoClinic.</p>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                        <h3 style="color: #155724; margin: 0;">✅ Configuración Exitosa</h3>
                        <p style="margin: 10px 0 0 0;">Si recibes este mensaje, tu configuración de Mailgun está funcionando correctamente.</p>
                    </div>
                    
                    <h3>📊 Detalles del Test:</h3>
                    <ul>
                        <li><strong>Servidor SMTP:</strong> smtp.mailgun.org</li>
                        <li><strong>Puerto:</strong> 587</li>
                        <li><strong>Remitente:</strong> Esmeralda &lt;contacto@esmeraldapodoclinica.cl&gt;</li>
                        <li><strong>Fecha:</strong> """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                        Este es un mensaje automático generado por el sistema de pruebas de PodoClinic.
                    </p>
                </div>
            </body>
            </html>
            """
            
            texto_plano = """
TEST DE MAILGUN - PODOCLINIC
============================

Este es un correo de prueba con formato HTML enviado desde PodoClinic.

✅ Configuración Exitosa
Si recibes este mensaje, tu configuración de Mailgun está funcionando correctamente.

📊 Detalles del Test:
- Servidor SMTP: smtp.mailgun.org
- Puerto: 587
- Remitente: Esmeralda <contacto@esmeraldapodoclinica.cl>
- Fecha: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """

Este es un mensaje automático generado por el sistema de pruebas de PodoClinic.
            """
            
            # Crear email con alternativas
            email = EmailMultiAlternatives(
                subject='[TEST HTML] Prueba de Mailgun con HTML - PodoClinic',
                body=texto_plano,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_destino],
                reply_to=[settings.DEFAULT_FROM_EMAIL],
                headers={
                    'X-PodoClinic-Test': 'HTML',
                    'X-Mailer': 'PodoClinic Test Suite'
                }
            )
            
            # Agregar contenido HTML
            email.attach_alternative(html_content, "text/html")
            
            # Enviar
            resultado = email.send(fail_silently=False)
            tiempo_transcurrido = time.time() - inicio
            
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"✅ ÉXITO: Correo HTML enviado en {tiempo_transcurrido:.2f} segundos"))
                self.stdout.write(f"   📊 Resultado: {resultado} correo(s) enviado(s)")
                self.stdout.write(f"   📎 Headers personalizados incluidos")
            else:
                self.stdout.write(self.style.ERROR("❌ ERROR: No se pudo enviar el correo HTML"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERROR: {str(e)}"))

    def test_complete(self, email_destino):
        """Test completo con monitoreo paso a paso"""
        self.stdout.write(f"\n🔴 INICIANDO TEST COMPLETO...")
        
        # Test 1: Simple
        self.stdout.write(f"\n📝 Paso 1/3: Test Simple")
        self.test_simple(email_destino)
        
        time.sleep(2)  # Pausa entre tests
        
        # Test 2: HTML
        self.stdout.write(f"\n📝 Paso 2/3: Test HTML")
        self.test_html(email_destino)
        
        time.sleep(2)  # Pausa entre tests
        
        # Test 3: Test con adjunto simulado (headers especiales)
        self.stdout.write(f"\n📝 Paso 3/3: Test Avanzado")
        self.test_avanzado(email_destino)
        
        # Resumen final
        self.mostrar_resumen()

    def test_avanzado(self, email_destino):
        """Test avanzado con más funcionalidades"""
        try:
            inicio = time.time()
            
            # Crear email avanzado
            email = EmailMultiAlternatives(
                subject='[TEST AVANZADO] Prueba Completa de Mailgun - PodoClinic',
                body=f"""
TEST AVANZADO DE MAILGUN - PODOCLINIC
=====================================

Este es el test más completo del sistema de correo.

🔧 Configuración verificada:
- Servidor: {settings.EMAIL_HOST}
- Usuario: {settings.EMAIL_HOST_USER}
- Puerto: {settings.EMAIL_PORT}
- TLS: {settings.EMAIL_USE_TLS}

📊 Estadísticas del Test:
- Timestamp: {datetime.now().isoformat()}
- Test ID: ADV-{int(time.time())}
- Destinatario: {email_destino}

Si recibes este mensaje, todos los componentes están funcionando correctamente.

¡PodoClinic está listo para enviar correos en producción! 🎉
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_destino],
                reply_to=[settings.DEFAULT_FROM_EMAIL],
                headers={
                    'X-PodoClinic-Test': 'Advanced',
                    'X-Test-ID': f'ADV-{int(time.time())}',
                    'X-Mailgun-Test': 'Complete',
                    'X-Priority': '1',
                    'Importance': 'high'
                }
            )
            
            # Enviar
            resultado = email.send(fail_silently=False)
            tiempo_transcurrido = time.time() - inicio
            
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"✅ ÉXITO: Correo avanzado enviado en {tiempo_transcurrido:.2f} segundos"))
                self.stdout.write(f"   📊 Resultado: {resultado} correo(s) enviado(s)")
                self.stdout.write(f"   🏷️  Headers especiales incluidos")
            else:
                self.stdout.write(self.style.ERROR("❌ ERROR: No se pudo enviar el correo avanzado"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERROR: {str(e)}"))

    def mostrar_resumen(self):
        """Muestra un resumen final del test"""
        self.stdout.write(f"\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN DEL TEST COMPLETO"))
        self.stdout.write("="*60)
        self.stdout.write(f"✅ Se ejecutaron 3 tipos de tests diferentes")
        self.stdout.write(f"📧 Configuración: Mailgun SMTP")
        self.stdout.write(f"🌐 Servidor: {settings.EMAIL_HOST}")
        self.stdout.write(f"👤 Remitente: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"⏰ Completado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        self.stdout.write(f"\n💡 PRÓXIMOS PASOS:")
        self.stdout.write(f"   1. Revisa tu bandeja de entrada")
        self.stdout.write(f"   2. Verifica que llegaron 3 correos diferentes")
        self.stdout.write(f"   3. Confirma que el remitente es 'Esmeralda'")
        self.stdout.write(f"   4. Si todo está bien, ¡Mailgun funciona perfectamente!")
        
        self.stdout.write(f"\n🔧 COMANDOS ÚTILES:")
        self.stdout.write(f"   python manage.py test_email_mailgun --to tu@email.com --test-type simple")
        self.stdout.write(f"   python manage.py test_email_mailgun --to tu@email.com --test-type html")
        self.stdout.write(f"   python manage.py test_email_mailgun --to tu@email.com --verbose")
        
        self.stdout.write(f"\n" + "="*60) 