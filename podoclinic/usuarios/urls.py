from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, login

router = DefaultRouter()
router.register('', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login, name='login'),
] 