from django.db import models

class Tratamiento(models.Model):
    TIPOS_TRATAMIENTO = [
        ('general', 'Podología general'),
        ('helomas', 'Helomas interdigitales'),
        ('hongos', 'Uñas con hongos (Onicomicosis)'),
        ('encarnada', 'Uña encarnada (Onicocriptosis)'),
        ('curacion', 'Curación Podología'),
        ('dermatomicoticos', 'Dermatomicoticos'),
        ('postura', 'Postura de brackets'),
        ('manicura', 'Manicura'),
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
    
    TIPOS_CITA = [
        ('podologia', 'Podología'),
        ('manicura', 'Manicura'),
    ]
    
    DURACIONES = [
        (60, '1 hora'),
        (120, '2 horas'),
    ]
    
    paciente = models.ForeignKey('pacientes.Paciente', on_delete=models.CASCADE)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE)
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='reservada')
    tipo_cita = models.CharField(max_length=20, choices=TIPOS_CITA, default='podologia')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    recordatorio_enviado = models.BooleanField(default=False)
    duracion_extendida = models.BooleanField(default=False)  # Para compatibilidad con código existente
    duracion_cita = models.IntegerField(choices=DURACIONES, default=60)  # Nueva duración en minutos
    
    class Meta:
        unique_together = ['fecha', 'hora']  # No puede haber dos citas al mismo tiempo
        
    def __str__(self):
        return f"{self.paciente.nombre} - {self.fecha} {self.hora}"
        
    def save(self, *args, **kwargs):
        # Sincronizar duracion_extendida con duracion_cita
        self.duracion_extendida = (self.duracion_cita == 120)
        super().save(*args, **kwargs)
