from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PacienteViewSet)
router.register(r'fichas', views.FichaClinicaViewSet)

urlpatterns = [
    path('crear_paciente_admin/', views.crear_paciente_admin, name='crear_paciente_admin'),
    path('', include(router.urls)),
]