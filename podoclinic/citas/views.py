from django.shortcuts import render
from rest_framework import viewsets
from .models import Cita, Tratamiento
from .serializers import CitaSerializer, TratamientoSerializer

# Create your views here.

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer

class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
