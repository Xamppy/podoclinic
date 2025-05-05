from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from .models import Insumo
from .serializers import InsumoSerializer
import logging

logger = logging.getLogger(__name__)

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
        try:
            # Obtener todos los insumos para debug
            todos_insumos = Insumo.objects.all()
            logger.info(f"Total de insumos: {todos_insumos.count()}")
            
            # Obtener insumos críticos
            insumos_criticos = Insumo.objects.filter(stock_actual__lte=F('stock_critico'))
            logger.info(f"Insumos críticos encontrados: {insumos_criticos.count()}")
            
            # Log de cada insumo para debug
            for insumo in insumos_criticos:
                logger.info(f"Insumo crítico: {insumo.nombre} - Stock actual: {insumo.stock_actual} - Stock crítico: {insumo.stock_critico}")
            
            serializer = self.get_serializer(insumos_criticos, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al obtener insumos críticos: {str(e)}")
            return Response(
                {'error': 'Error al obtener insumos críticos'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
