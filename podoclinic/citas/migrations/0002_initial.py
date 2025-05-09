# Generated by Django 5.2 on 2025-05-02 00:10

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('citas', '0001_initial'),
        ('pacientes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='cita',
            name='paciente',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='pacientes.paciente'),
        ),
        migrations.AddField(
            model_name='cita',
            name='tratamiento',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='citas.tratamiento'),
        ),
        migrations.AlterUniqueTogether(
            name='cita',
            unique_together={('fecha', 'hora')},
        ),
    ]
