# Generated by Django 4.2.11 on 2025-05-27 20:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacientes', '0003_usoproductoenficha'),
    ]

    operations = [
        migrations.AddField(
            model_name='fichaclinica',
            name='costo_total',
            field=models.DecimalField(decimal_places=0, default=0, help_text='Costo total de los productos utilizados', max_digits=10),
        ),
    ]
