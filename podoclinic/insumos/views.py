from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from .models import Insumo
from .serializers import InsumoSerializer

# Create your views here.

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def stock_critico(self, request):
        insumos_criticos = Insumo.objects.filter(stock_actual__lte=F('stock_critico'))
        serializer = self.get_serializer(insumos_criticos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def actualizar_stock(self, request, pk=None):
        insumo = self.get_object()
        cantidad = request.data.get('cantidad')
        
        if cantidad is None:
            return Response(
                {'error': 'Debe proporcionar una cantidad'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            cantidad = int(cantidad)
            insumo.stock_actual = cantidad
            insumo.save()
            serializer = self.get_serializer(insumo)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'La cantidad debe ser un número entero'},
                status=status.HTTP_400_BAD_REQUEST
            )
