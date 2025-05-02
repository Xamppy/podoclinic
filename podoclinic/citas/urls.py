from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, TratamientoViewSet

router = DefaultRouter()
router.register(r'citas', CitaViewSet)
router.register(r'tratamientos', TratamientoViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 