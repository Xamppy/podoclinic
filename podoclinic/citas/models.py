from django.db import models

class Tratamiento(models.Model):
    TIPOS_TRATAMIENTO = [
        ('general', 'Podología general'),
        ('reflexologia', 'Reflexología Podal'),
        ('hongos', 'Uñas con hongos (Onicomicosis)'),
        ('encarnada', 'Uña encarnada (Onicocriptosis)'),
        ('curacion', 'Curación Podología'),
        ('esmalte', 'Retiro de esmalte'),
    ]
    
    nombre = models.CharField(max_length=100, choices=TIPOS_TRATAMIENTO)
    descripcion = models.TextField(blank=True, null=True)
    duracion_minutos = models.IntegerField(default=60)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return self.get_nombre_display()
    
    
class Cita(models.Model):
    ESTADOS = [
        ('reservada', 'Reservada'),
        ('confirmada', 'Confirmada'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]
    
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.CASCADE)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE)
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='reservada')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    recordatorio_enviado = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['fecha', 'hora']  # No puede haber dos citas al mismo tiempo
        
    def __str__(self):
        return f"{self.paciente.nombre} - {self.fecha} {self.hora}"
