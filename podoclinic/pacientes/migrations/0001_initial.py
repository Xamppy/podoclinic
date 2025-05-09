# Generated by Django 5.2 on 2025-05-02 00:10

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('citas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Paciente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rut', models.CharField(max_length=12, unique=True, validators=[django.core.validators.RegexValidator(message='Formato RUT inválido. Use formato: 12.345.678-9', regex='^\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]$')])),
                ('nombre', models.CharField(max_length=100)),
                ('telefono', models.CharField(max_length=15)),
                ('correo', models.EmailField(max_length=254)),
                ('enfermedad_base', models.TextField(blank=True, null=True)),
                ('contacto_emergencia', models.CharField(blank=True, max_length=100, null=True)),
                ('caso_clinico', models.TextField(blank=True, null=True)),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='FichaClinica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField()),
                ('descripcion_atencion', models.TextField()),
                ('procedimiento', models.TextField()),
                ('indicaciones', models.TextField()),
                ('proxima_sesion_estimada', models.DateField(blank=True, null=True)),
                ('cita', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='citas.cita')),
                ('paciente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='pacientes.paciente')),
            ],
        ),
    ]
