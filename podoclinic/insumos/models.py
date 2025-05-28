from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Insumo(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    unidad_medida = models.CharField(max_length=20)
    stock_actual = models.IntegerField(default=0)
    stock_critico = models.IntegerField(default=5)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=0, default=0, help_text="Valor unitario en CLP")
    fecha_vencimiento = models.DateField(null=True, blank=True, help_text="Fecha de vencimiento del insumo (opcional)")
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.stock_actual} {self.unidad_medida})"
    
    @property
    def en_stock_critico(self):
        return self.stock_actual <= self.stock_critico
    
    @property
    def valor_unitario_formato(self):
        return f"${self.valor_unitario:,.0f}"

class MovimientoInsumo(models.Model):
    TIPOS = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
    ]
    
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    tipo_movimiento = models.CharField(max_length=10, choices=TIPOS)
    motivo = models.CharField(max_length=200)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.get_tipo_movimiento_display()} de {self.cantidad} {self.insumo.unidad_medida} de {self.insumo.nombre}"

@receiver(post_save, sender=MovimientoInsumo)
def actualizar_stock(sender, instance, created, **kwargs):
    if created:
        insumo = instance.insumo
        if instance.tipo_movimiento == 'entrada':
            insumo.stock_actual += instance.cantidad
        else:  # salida
            insumo.stock_actual -= instance.cantidad
        insumo.save()