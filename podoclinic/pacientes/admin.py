from django.contrib import admin
from .models import Paciente, FichaClinica, UsoProductoEnFicha

@admin.register(UsoProductoEnFicha)
class UsoProductoEnFichaAdmin(admin.ModelAdmin):
    list_display = ('id', 'ficha', 'insumo', 'cantidad', 'fecha_uso')
    list_filter = ('insumo', 'fecha_uso')
    search_fields = ('ficha__paciente__nombre', 'insumo__nombre')
    raw_id_fields = ('ficha', 'insumo')

# Registrar otros modelos si no lo están ya
@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre', 'fecha_nacimiento', 'telefono', 'correo')
    search_fields = ('rut', 'nombre', 'correo')

@admin.register(FichaClinica)
class FichaClinicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'fecha', 'proxima_sesion_estimada')
    list_filter = ('fecha',)
    search_fields = ('paciente__nombre', 'descripcion_atencion')
    raw_id_fields = ('paciente', 'cita')
