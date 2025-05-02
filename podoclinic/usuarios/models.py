from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = [
        ('admin', 'Administrador'),
        ('profesional', 'Profesional Clínico'),
    ]
    
    rol = models.CharField(max_length=20, choices=ROLES, default='profesional')
    
    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"