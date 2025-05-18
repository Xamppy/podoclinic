"""
URL configuration for podoclinic project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from .views import database_backup

# Vista para manejar 404 en rutas de API
def api_not_found(request):
    return JsonResponse({'error': 'Endpoint no encontrado'}, status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/pacientes/', include('pacientes.urls')),
    path('api/citas/', include('citas.urls')),
    path('api/insumos/', include('insumos.urls')),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/database/backup/', database_backup, name='database_backup'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# API fallback para rutas no encontradas (debe ir antes del fallback general)
urlpatterns += [
    re_path(r'^api/.*$', api_not_found),
]

# En producción, esto debería manejarse por el servidor web
if settings.DEBUG:
    urlpatterns += [
        # Todas las demás rutas van a la SPA de React
        re_path(r'^(?!admin/)(?!api/).*$', TemplateView.as_view(template_name='index.html')),
    ]
