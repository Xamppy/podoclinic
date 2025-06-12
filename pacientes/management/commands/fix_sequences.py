from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Reinicia todas las secuencias de la base de datos para evitar errores de llaves duplicadas'

    def handle(self, *args, **options):
        cursor = connection.cursor()
        
        # Definir secuencias y sus tablas correspondientes
        sequences_tables = [
            ('pacientes_fichaclinica_id_seq', 'pacientes_fichaclinica'),
            ('pacientes_paciente_id_seq', 'pacientes_paciente'),
            ('citas_cita_id_seq', 'citas_cita'),
            ('citas_tratamiento_id_seq', 'citas_tratamiento'),
            ('insumos_insumo_id_seq', 'insumos_insumo'),
            ('insumos_movimientoinsumo_id_seq', 'insumos_movimientoinsumo'),
            ('pacientes_usoproductoenficha_id_seq', 'pacientes_usoproductoenficha'),
            ('usuarios_usuario_id_seq', 'usuarios_usuario')
        ]
        
        self.stdout.write("Reiniciando secuencias de la base de datos...")
        
        for seq, table in sequences_tables:
            try:
                cursor.execute(f"SELECT setval('{seq}', (SELECT COALESCE(MAX(id), 0) + 1 FROM {table}));")
                result = cursor.fetchone()
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {seq}: {result[0]}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error en {seq}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 Secuencias reiniciadas correctamente!')
        )
        self.stdout.write("Ahora puedes crear nuevas fichas clínicas sin problemas de llaves duplicadas.") 