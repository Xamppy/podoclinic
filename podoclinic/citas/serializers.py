from rest_framework import serializers
from .models import Tratamiento, Cita
from pacientes.models import Paciente

class TratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.ReadOnlyField(source='paciente.nombre')
    paciente_rut = serializers.ReadOnlyField(source='paciente.rut')
    tratamiento_nombre = serializers.ReadOnlyField(source='tratamiento.get_nombre_display')
    
    class Meta:
        model = Cita
        fields = '__all__'

class ReservaCitaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=20)
    fecha = serializers.DateField()
    hora = serializers.TimeField()
    servicio = serializers.CharField(max_length=100)
    notas = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Buscar o crear el paciente
        paciente, created = Paciente.objects.get_or_create(
            email=validated_data['email'],
            defaults={
                'nombre': validated_data['nombre'],
                'telefono': validated_data['telefono']
            }
        )

        # Buscar el tratamiento
        try:
            tratamiento = Tratamiento.objects.get(nombre=validated_data['servicio'])
        except Tratamiento.DoesNotExist:
            raise serializers.ValidationError({'servicio': 'Servicio no encontrado'})

        # Crear la cita
        cita = Cita.objects.create(
            paciente=paciente,
            tratamiento=tratamiento,
            fecha=validated_data['fecha'],
            hora=validated_data['hora'],
            notas=validated_data.get('notas', '')
        )

        return cita