from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'fichas', views.FichaClinicaViewSet, basename='fichas')
router.register(r'', views.PacienteViewSet, basename='pacientes')

urlpatterns = [
    path('crear_paciente_admin/', views.crear_paciente_admin, name='crear_paciente_admin'),
    path('actualizar_paciente_admin/', views.actualizar_paciente_admin, name='actualizar_paciente_admin'),
    path('backup/', views.backup_database, name='backup_database'),

    path('', include(router.urls)),
]