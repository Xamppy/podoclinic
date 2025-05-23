# backend/Dockerfile

# Etapa 1: Imagen base de Python
FROM python:3.11-slim-bullseye

# Instala dependencias del sistema
RUN apt-get update \
    && apt-get install -y wget gnupg2 lsb-release \
    && echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update \
    && apt-get install -y postgresql-client-13 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
    
# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar script de entrypoint
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copiar el resto del código de la aplicación Django
COPY . .

# Recolectar archivos estáticos de Django
RUN python manage.py collectstatic --noinput --clear

# Exponer el puerto en el que Gunicorn se ejecutará
EXPOSE 8000

# Entrypoint para ejecutar migraciones y luego el CMD
ENTRYPOINT ["/entrypoint.sh"]

# Comando por defecto para iniciar Gunicorn
CMD ["gunicorn", "podoclinic.wsgi:application", "--bind", "0.0.0.0:8000"] 