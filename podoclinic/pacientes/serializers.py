from rest_framework import serializers
from .models import Paciente, FichaClinica
from .utils import formatear_rut, validar_rut

class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = '__all__'
    
    def validate_rut(self, value):
        rut_formateado = formatear_rut(value)
        
        if not rut_formateado:
            raise serializers.ValidationError("Formato de RUT inválido")
        
        if not validar_rut(value):
            raise serializers.ValidationError("RUT inválido (dígito verificador incorrecto)")
        
        return rut_formateado

class FichaClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaClinica
        fields = '__all__'