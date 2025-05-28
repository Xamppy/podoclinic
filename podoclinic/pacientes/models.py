from django.db import models
from django.core.validators import RegexValidator

class Paciente(models.Model):
    rut = models.CharField(
        max_length=12,
        unique=True,
        validators=[RegexValidator(
            regex=r'^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$',
            message='Formato RUT inválido. Use formato: 12.345.678-9'
        )]
    )
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=15)
    correo = models.EmailField()
    enfermedad_base = models.TextField(blank=True, null=True)
    contacto_emergencia = models.CharField(max_length=100, blank=True, null=True)
    caso_clinico = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    direccion = models.CharField(max_length=200, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} ({self.rut})"
    
class FichaClinica(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    cita = models.OneToOneField('citas.Cita', on_delete=models.CASCADE, null=True, blank=True)
    fecha = models.DateField()
    descripcion_atencion = models.TextField()
    procedimiento = models.TextField()
    indicaciones = models.TextField()
    proxima_sesion_estimada = models.DateField(null=True, blank=True)
    costo_total = models.DecimalField(max_digits=10, decimal_places=0, default=0, help_text="Costo total de los productos utilizados")
    
    def calcular_costo_total(self):
        try:
            total = 0
            for uso in self.productos_usados.all():
                try:
                    if uso.insumo and uso.insumo.valor_unitario is not None:
                        total += uso.insumo.valor_unitario * uso.cantidad
                except Exception as e:
                    print(f"Error al calcular costo para producto {uso.insumo_id if uso.insumo_id else 'desconocido'}: {str(e)}")
                    continue
            
            self.costo_total = total
            self.save(update_fields=['costo_total'])
            return total
        except Exception as e:
            print(f"Error al calcular costo total: {str(e)}")
            if not self.costo_total:
                self.costo_total = 0
                self.save(update_fields=['costo_total'])
            return self.costo_total
    
    def __str__(self):
        return f"Ficha de {self.paciente.nombre} - {self.fecha}"

class UsoProductoEnFicha(models.Model):
    ficha = models.ForeignKey(FichaClinica, on_delete=models.CASCADE, related_name='productos_usados')
    insumo = models.ForeignKey('insumos.Insumo', on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    fecha_uso = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Uso de producto en ficha"
        verbose_name_plural = "Usos de productos en fichas"
        
    def __str__(self):
        return f"{self.cantidad} de {self.insumo.nombre} en ficha de {self.ficha.paciente.nombre} ({self.ficha.fecha})"