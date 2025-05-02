from rest_framework import serializers
from .models import Insumo, MovimientoInsumo

class InsumoSerializer(serializers.ModelSerializer):
    en_stock_critico = serializers.ReadOnlyField()
    
    class Meta:
        model = Insumo
        fields = '__all__'

class MovimientoInsumoSerializer(serializers.ModelSerializer):
    insumo_nombre = serializers.ReadOnlyField(source='insumo.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='usuario.get_full_name')
    
    class Meta:
        model = MovimientoInsumo
        fields = '__all__'