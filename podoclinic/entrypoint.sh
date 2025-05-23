#!/bin/sh

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Base de datos lista!"

# Aplicar migraciones de la base de datos
echo "Aplicando migraciones de la base de datos..."
python manage.py migrate --noinput

# Crear superusuario si no existe
echo "Verificando superusuario..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superusuario creado')
else:
    print('Superusuario ya existe')
END

# Ejecutar el comando pasado al script (CMD del Dockerfile)
exec "$@" 