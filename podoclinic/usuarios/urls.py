from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, login
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register('', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 