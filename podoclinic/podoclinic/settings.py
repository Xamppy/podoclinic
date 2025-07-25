"""
Django settings for podoclinic project.

Generated by 'django-admin startproject' using Django 5.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

from pathlib import Path
from datetime import timedelta
import os

# Intentar cargar variables de entorno desde .env si existe
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv no está instalado

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-ij)^kt($dka^zp46%ot)4(#jy4!442^a9d5))k+ynn%$&0tte6')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# Detectar si estamos en desarrollo local
IS_LOCAL_DEV = True  # Forzar desarrollo local temporalmente

# Configuración de hosts permitidos para desarrollo local
if IS_LOCAL_DEV:
    ALLOWED_HOSTS = ['*']  # Permitir todos los hosts en desarrollo
else:
    ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'esmeraldapodoclinica.cl,www.esmeraldapodoclinica.cl,148.113.171.213').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Para blacklist de tokens
    'corsheaders',
    'django_filters',
    'django_celery_results',  # Para almacenar resultados de tareas Celery
    'django_celery_beat',     # Para tareas periódicas con Celery
    'anymail',                # Django Anymail para Mailgun API
    'pacientes',
    'citas',
    'insumos',
    'usuarios',
]

AUTH_USER_MODEL = 'usuarios.Usuario'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware debe ser lo primero
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Para servir archivos estáticos
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Configuración CORS para producción
CORS_ALLOWED_ORIGINS = [
    "https://esmeraldapodoclinica.cl",
    "https://www.esmeraldapodoclinica.cl",
    "http://localhost:3000",  # Solo para desarrollo local
    "http://127.0.0.1:3000",  # Solo para desarrollo local
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Configuración CSRF para producción
CSRF_TRUSTED_ORIGINS = [
    'https://esmeraldapodoclinica.cl',
    'https://www.esmeraldapodoclinica.cl',
    'http://localhost:3000',  # Solo para desarrollo local
    'http://127.0.0.1:3000',  # Solo para desarrollo local
]
CSRF_COOKIE_SECURE = not IS_LOCAL_DEV  # False en desarrollo local, True en producción
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = not IS_LOCAL_DEV  # False en desarrollo (usa cookies), True en producción (usa sesiones)
CSRF_COOKIE_NAME = 'csrftoken'

# Configuración de sesiones
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Usar base de datos para sesiones
SESSION_COOKIE_AGE = 60 * 60 * 8  # 8 horas (28800 segundos)
SESSION_COOKIE_SECURE = not IS_LOCAL_DEV  # False en desarrollo local, True en producción
SESSION_COOKIE_HTTPONLY = True  # Prevenir acceso desde JavaScript
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True  # Renovar sesión en cada request
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # No expirar al cerrar navegador
SESSION_COOKIE_NAME = 'sessionid'

ROOT_URLCONF = 'podoclinic.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'podoclinic.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'podoclinic_db'),
        'USER': os.environ.get('DB_USER', 'podoclinic_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')

CELERY_BEAT_SCHEDULE = {
    'enviar-recordatorios-diarios': {
        'task': 'citas.tasks.enviar_recordatorios_citas',
        'schedule': timedelta(hours=24),
        'args': (),
    },
}

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'es-cl'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = '/django_static/'
STATIC_ROOT = BASE_DIR / 'staticfiles_collected'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Rest Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),  # 8 horas en lugar de 1
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # 7 días en lugar de 1
    'ROTATE_REFRESH_TOKENS': True,  # Rotar tokens para mayor seguridad
    'BLACKLIST_AFTER_ROTATION': True,  # Invalidar tokens antiguos
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(hours=8),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=7),
}

# Configuración de logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'django.log'),
            'formatter': 'verbose'
        },
        'mail_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'mail.log'),
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'citas': {
            'handlers': ['console', 'mail_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Configuración de correo electrónico (Mailgun API con Anymail)
EMAIL_BACKEND = 'anymail.backends.mailgun.EmailBackend'
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Esmeralda <contacto@esmeraldapodoclinica.cl>')

# Configuración de Anymail para Mailgun
ANYMAIL = {
    "MAILGUN_API_KEY": os.environ.get('MAILGUN_API_KEY'),
    "MAILGUN_SENDER_DOMAIN": os.environ.get('MAILGUN_SENDER_DOMAIN', 'esmeraldapodoclinica.cl'),
    "MAILGUN_API_URL": os.environ.get('MAILGUN_API_URL', 'https://api.mailgun.net/v3'),  # Para cuentas US
}

# Configuración adicional de Anymail (opcional)
ANYMAIL_DEBUG_API_REQUESTS = os.environ.get('ANYMAIL_DEBUG', 'False') == 'True'

# ===== CONFIGURACIONES DE SEGURIDAD PARA PRODUCCIÓN =====

# Configuración de seguridad HTTPS
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True' and not IS_LOCAL_DEV
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Headers de seguridad
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Configuración de archivos estáticos para producción
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Configuración de base de datos para producción
DATABASES['default']['CONN_MAX_AGE'] = 60  # Conexiones persistentes

# Configuración de logging para producción
LOGGING['handlers']['file']['level'] = 'WARNING'  # Solo warnings y errores en archivo
LOGGING['handlers']['console']['level'] = 'ERROR'  # Solo errores en consola

# Variables de entorno requeridas para producción
REQUIRED_ENV_VARS = [
    'DJANGO_SECRET_KEY',
    'DB_PASSWORD',
    'MAILGUN_API_KEY',
]

# Verificar variables de entorno críticas
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.environ.get(var)]
if missing_vars and not DEBUG:
    raise ValueError(f"Variables de entorno faltantes: {', '.join(missing_vars)}")

# Configuración de Redis para producción (si usas Celery)
if not DEBUG:
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
