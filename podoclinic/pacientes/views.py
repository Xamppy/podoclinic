from rest_framework import viewsets
from .models import Paciente, FichaClinica
from .serializers import PacienteSerializer, FichaClinicaSerializer

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    
    def get_queryset(self):
        queryset = Paciente.objects.all()
        rut = self.request.query_params.get('rut', None)
        
        if rut is not None:
            from .utils import formatear_rut
            rut_formateado = formatear_rut(rut)
            if rut_formateado:
                queryset = queryset.filter(rut=rut_formateado)
                
        return queryset

class FichaClinicaViewSet(viewsets.ModelViewSet):
    queryset = FichaClinica.objects.all()
    serializer_class = FichaClinicaSerializer
    
    def get_queryset(self):
        queryset = FichaClinica.objects.all()
        paciente_id = self.request.query_params.get('paciente', None)
        
        if paciente_id is not None:
            queryset = queryset.filter(paciente_id=paciente_id)
                
        return queryset