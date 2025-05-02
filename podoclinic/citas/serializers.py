from rest_framework import serializers
from .models import Tratamiento, Cita

class TratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.ReadOnlyField(source='paciente.nombre')
    tratamiento_nombre = serializers.ReadOnlyField(source='tratamiento.get_nombre_display')
    
    class Meta:
        model = Cita
        fields = '__all__'