from rest_framework import serializers
from .models import Tratamiento, Cita
from pacientes.models import Paciente

class TratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    paciente_rut = serializers.CharField(source='paciente.rut', read_only=True)
    paciente_nombre = serializers.CharField(source='paciente.nombre', read_only=True)
    paciente_apellido = serializers.CharField(source='paciente.apellido', read_only=True)
    tipo_tratamiento = serializers.CharField(source='tratamiento.descripcion', read_only=True)
    
    class Meta:
        model = Cita
        fields = [
            'id', 'paciente_rut', 'paciente_nombre', 'paciente_apellido',
            'tipo_tratamiento', 'fecha', 'hora', 'estado', 'tipo_cita',
            'duracion_extendida', 'duracion_cita', 'fecha_creacion'
        ]

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