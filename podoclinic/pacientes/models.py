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
    
    def __str__(self):
        return f"Ficha de {self.paciente.nombre} - {self.fecha}"