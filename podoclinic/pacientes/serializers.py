from rest_framework import serializers
from .models import Paciente, FichaClinica, UsoProductoEnFicha
from .utils import formatear_rut, validar_rut
import logging

logger = logging.getLogger(__name__)

class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = '__all__'
    
    def validate_rut(self, value):
        rut_formateado = formatear_rut(value)
        
        if not rut_formateado:
            raise serializers.ValidationError("Formato de RUT inválido")
        
        if not validar_rut(value):
            raise serializers.ValidationError("RUT inválido (dígito verificador incorrecto)")
        
        return rut_formateado
    
    def validate_fecha_nacimiento(self, value):
        # Si el valor es una cadena vacía, devolver None
        if value == '':
            return None
        return value

class UsoProductoEnFichaSerializer(serializers.ModelSerializer):
    nombre_insumo = serializers.ReadOnlyField(source='insumo.nombre')
    unidad_medida = serializers.ReadOnlyField(source='insumo.unidad_medida')
    
    class Meta:
        model = UsoProductoEnFicha
        fields = ['id', 'insumo', 'nombre_insumo', 'cantidad', 'unidad_medida', 'fecha_uso']
    
    def to_representation(self, instance):
        # Asegurarnos de que el insumo se represente como su ID (entero)
        ret = super().to_representation(instance)
        if 'insumo' in ret and ret['insumo'] is not None:
            ret['insumo'] = instance.insumo.id
        return ret
    
    def to_internal_value(self, data):
        # Asegurarnos de que el insumo se convierta correctamente a ID
        if 'insumo' in data and data['insumo'] is not None:
            if not isinstance(data['insumo'], int):
                try:
                    data['insumo'] = int(data['insumo'])
                except (ValueError, TypeError):
                    raise serializers.ValidationError({'insumo': 'El ID del insumo debe ser un número entero'})
        return super().to_internal_value(data)

class FichaClinicaSerializer(serializers.ModelSerializer):
    productos_usados = UsoProductoEnFichaSerializer(many=True, read_only=True)
    productos_usados_data = UsoProductoEnFichaSerializer(many=True, write_only=True, required=False)
    costo_total_formato = serializers.SerializerMethodField()
    
    class Meta:
        model = FichaClinica
        fields = '__all__'
    
    def get_costo_total_formato(self, obj):
        try:
            if obj.costo_total is None or obj.costo_total == 0:
                return '$0'
            return f"${int(obj.costo_total):,d}"
        except Exception as e:
            logger.error(f"Error al formatear costo total para ficha {obj.id}: {str(e)}")
            return '$0'
    
    def to_representation(self, instance):
        try:
            # Asegurarse de que los productos usados existan
            productos = instance.productos_usados.all()
            logger.info(f"Productos encontrados para ficha {instance.id}: {len(productos)}")
            
            # Intentar calcular el costo total
            try:
                instance.calcular_costo_total()
            except Exception as e:
                logger.error(f"Error al calcular costo total para ficha {instance.id}: {str(e)}")
            
            return super().to_representation(instance)
        except Exception as e:
            logger.error(f"Error en to_representation para ficha {instance.id}: {str(e)}")
            # Intentar una representación básica sin productos
            try:
                data = {
                    'id': instance.id,
                    'fecha': instance.fecha,
                    'descripcion_atencion': instance.descripcion_atencion,
                    'procedimiento': instance.procedimiento,
                    'indicaciones': instance.indicaciones,
                    'productos_usados': [],
                    'costo_total': 0,
                    'costo_total_formato': '$0'
                }
                return data
            except Exception as inner_e:
                logger.error(f"Error en representación básica para ficha {instance.id}: {str(inner_e)}")
                raise

    def validate(self, data):
        try:
            # Validar productos usados
            if 'productos_usados_data' in self.initial_data:
                productos_data = self.initial_data.get('productos_usados_data', [])
                print(f"Validando {len(productos_data)} productos usados:", productos_data)
                
                for producto in productos_data:
                    if not isinstance(producto, dict):
                        raise serializers.ValidationError({"productos_usados": f"Formato inválido de producto: {producto}"})
                    
                    if 'insumo' not in producto:
                        raise serializers.ValidationError({"productos_usados": f"Falta el campo 'insumo' en el producto: {producto}"})
                    
                    if 'cantidad' not in producto:
                        raise serializers.ValidationError({"productos_usados": f"Falta el campo 'cantidad' en el producto: {producto}"})
                    
                    try:
                        insumo_id = int(producto['insumo'])
                        cantidad = int(producto['cantidad'])
                        
                        from insumos.models import Insumo
                        try:
                            insumo = Insumo.objects.get(id=insumo_id)
                            print(f"Insumo encontrado: {insumo} (stock: {insumo.stock_actual})")
                            
                            if cantidad <= 0:
                                raise serializers.ValidationError({"productos_usados": f"La cantidad debe ser mayor a 0 para el producto {insumo.nombre}"})
                                
                        except Insumo.DoesNotExist:
                            raise serializers.ValidationError({"productos_usados": f"No existe un insumo con ID {insumo_id}"})
                            
                    except (ValueError, TypeError):
                        raise serializers.ValidationError({"productos_usados": f"ID de insumo o cantidad inválidos en el producto: {producto}"})
            
            return data
        except Exception as e:
            print(f"Error en validate: {str(e)}")
            raise

    def create(self, validated_data):
        print("Iniciando creación de ficha clínica")
        productos_usados_data = validated_data.pop('productos_usados_data', [])
        
        # Crear la ficha clínica
        ficha = FichaClinica.objects.create(**validated_data)
        
        # Procesar productos y crear registros de uso
        self._procesar_productos(ficha, productos_usados_data)
        
        # Calcular el costo total
        ficha.calcular_costo_total()
        
        return ficha

    def update(self, instance, validated_data):
        print("Iniciando actualización de ficha clínica")
        productos_usados_data = validated_data.pop('productos_usados_data', [])
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Eliminar productos usados anteriores
        instance.productos_usados.all().delete()
        
        # Procesar nuevos productos
        self._procesar_productos(instance, productos_usados_data)
        
        # Recalcular el costo total
        instance.calcular_costo_total()
        
        return instance

    def _procesar_productos(self, ficha, productos_data):
        from insumos.models import Insumo, MovimientoInsumo
        
        if not productos_data and 'productos_usados' in self.initial_data:
            productos_data = self.initial_data.get('productos_usados', [])
        
        usuario = None
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            usuario = request.user
        
        for producto_data in productos_data:
            try:
                insumo_id = producto_data.get('insumo')
                cantidad = producto_data.get('cantidad', 0)
                
                if not insumo_id or cantidad <= 0:
                    continue
                
                if not isinstance(insumo_id, int):
                    insumo_id = int(insumo_id) if not hasattr(insumo_id, 'id') else insumo_id.id
                
                insumo = Insumo.objects.get(id=insumo_id)
                
                if insumo.stock_actual < cantidad:
                    continue
                
                uso = UsoProductoEnFicha.objects.create(
                    ficha=ficha,
                    insumo_id=insumo_id,
                    cantidad=cantidad
                )
                
                MovimientoInsumo.objects.create(
                    insumo=insumo,
                    cantidad=cantidad,
                    tipo_movimiento='salida',
                    motivo=f"Uso en ficha clínica #{ficha.id}",
                    usuario=usuario
                )
                
            except (ValueError, TypeError, Insumo.DoesNotExist):
                continue