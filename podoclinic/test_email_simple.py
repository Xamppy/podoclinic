#!/usr/bin/env python
"""
Script simple para probar el envío de correos con Mailgun
Uso: python test_email_simple.py tu@email.com
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'podoclinic.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email(email_destino):
    """Envía un correo de prueba simple"""
    print(f"\n🧪 PRUEBA RÁPIDA DE MAILGUN - PODOCLINIC")
    print(f"="*50)
    
    # Mostrar configuración
    print(f"📧 Destinatario: {email_destino}")
    print(f"🌐 Servidor: {settings.EMAIL_HOST}")
    print(f"👤 Remitente: {settings.DEFAULT_FROM_EMAIL}")
    print(f"⏰ Hora: {datetime.now().strftime('%H:%M:%S')}")
    
    print(f"\n🚀 Enviando correo...")
    
    try:
        import time
        inicio = time.time()
        
        # Enviar correo
        resultado = send_mail(
            subject='🧪 Prueba Rápida - Mailgun PodoClinic',
            message=f"""
¡Hola!

Este es un correo de prueba rápida desde PodoClinic.

✅ Si recibes este mensaje, Mailgun está funcionando correctamente.

📊 Detalles:
- Enviado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Servidor: {settings.EMAIL_HOST}
- Remitente: {settings.DEFAULT_FROM_EMAIL}

¡Tu configuración está perfecta! 🎉

--
PodoClinic Test Suite
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_destino],
            fail_silently=False,
        )
        
        tiempo = time.time() - inicio
        
        if resultado:
            print(f"✅ ¡ÉXITO! Correo enviado en {tiempo:.2f} segundos")
            print(f"📊 Resultado: {resultado} correo(s) procesado(s)")
            print(f"\n💡 Revisa tu bandeja de entrada en unos minutos.")
        else:
            print(f"❌ ERROR: No se pudo enviar el correo")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print(f"\n🔧 Verifica tu configuración en el archivo .env")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python test_email_simple.py tu@email.com")
        sys.exit(1)
    
    email = sys.argv[1]
    
    # Validar email básico
    if "@" not in email or "." not in email:
        print("❌ Por favor proporciona un email válido")
        sys.exit(1)
    
    # Ejecutar test
    exito = test_email(email)
    
    if exito:
        print(f"\n🎯 Test completado. ¡Revisa tu email!")
    else:
        print(f"\n⚠️  Hubo problemas con el envío.")
        sys.exit(1) 