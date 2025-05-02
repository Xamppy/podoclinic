from django.contrib import admin
from .models import Insumo, MovimientoInsumo

@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'unidad_medida', 'stock_actual', 'stock_critico', 'ultima_actualizacion')
    list_filter = ('unidad_medida',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)

@admin.register(MovimientoInsumo)
class MovimientoInsumoAdmin(admin.ModelAdmin):
    list_display = ('id', 'insumo', 'cantidad', 'tipo_movimiento', 'motivo', 'fecha_movimiento', 'usuario')
    list_filter = ('tipo_movimiento', 'insumo', 'usuario')
    search_fields = ('insumo__nombre', 'motivo')
    ordering = ('-fecha_movimiento',)
