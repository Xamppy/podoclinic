from django import forms
from .models import Paciente
from .utils import formatear_rut, validar_rut

class PacienteForm(forms.ModelForm):
    class Meta:
        model = Paciente
        fields = ['rut', 'nombre', 'telefono', 'correo', 'enfermedad_base', 
                  'contacto_emergencia', 'caso_clinico']
    
    def clean_rut(self):
        rut = self.cleaned_data.get('rut')
        rut_formateado = formatear_rut(rut)
        
        if not rut_formateado:
            raise forms.ValidationError("Formato de RUT inválido")
        
        if not validar_rut(rut):
            raise forms.ValidationError("RUT inválido (dígito verificador incorrecto)")
        
        return rut_formateado