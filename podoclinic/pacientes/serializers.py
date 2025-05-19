from rest_framework import serializers
from .models import Paciente, FichaClinica, UsoProductoEnFicha
from .utils import formatear_rut, validar_rut

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
    productos_usados = UsoProductoEnFichaSerializer(many=True)
    
    class Meta:
        model = FichaClinica
        fields = '__all__'
    
    def validate(self, data):
        # Validar productos usados
        if 'productos_usados' in self.initial_data:
            productos_data = self.initial_data.get('productos_usados', [])
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

    def create(self, validated_data):
        print("Iniciando creación de ficha clínica")
        productos_usados_data = []
        
        # Extraer productos usados de los datos iniciales
        if 'productos_usados' in self.initial_data:
            productos_usados_data = self.initial_data.get('productos_usados', [])
            print(f"Procesando {len(productos_usados_data)} productos usados")
        else:
            print("No se recibieron productos usados en los datos iniciales")
            
        # Crear la ficha clínica primero
        print("Creando ficha clínica con datos:", validated_data)
        ficha = FichaClinica.objects.create(**validated_data)
        print(f"Ficha clínica creada con ID: {ficha.id}")
        
        # Si no hay productos para procesar, retornar la ficha
        if not productos_usados_data:
            print("No hay productos para procesar, finalizando creación")
            return ficha
        
        # Procesar los productos usados
        from insumos.models import Insumo, MovimientoInsumo
        
        # Obtener usuario si está disponible en el contexto
        usuario = None
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            usuario = request.user
            print(f"Usuario autenticado: {usuario}")
        else:
            print("No hay usuario autenticado en el contexto")
        
        print("Procesando productos usados")
        for producto_data in productos_usados_data:
            try:
                insumo_id = producto_data.get('insumo')
                cantidad = producto_data.get('cantidad', 0)
                
                # Verificar que los datos sean válidos
                if not insumo_id or cantidad <= 0:
                    print(f"Datos inválidos: insumo_id={insumo_id}, cantidad={cantidad}")
                    continue
                
                # Asegurarse de que insumo_id sea un entero
                if not isinstance(insumo_id, int):
                    # Si es un objeto, intentar obtener su id
                    if hasattr(insumo_id, 'id'):
                        insumo_id = insumo_id.id
                    # Convertir a entero si es una cadena
                    else:
                        insumo_id = int(insumo_id)
                
                # Obtener el insumo y verificar stock
                insumo = Insumo.objects.get(id=insumo_id)
                print(f"Verificando stock para {insumo.nombre}: disponible {insumo.stock_actual}, requerido {cantidad}")
                
                if insumo.stock_actual < cantidad:
                    print(f"Stock insuficiente para {insumo.nombre}")
                    continue
                
                # Crear el registro de uso de producto
                print(f"Creando registro de uso para {cantidad} unidades de {insumo.nombre}")
                uso = UsoProductoEnFicha.objects.create(
                    ficha=ficha,
                    insumo_id=insumo_id,
                    cantidad=cantidad
                )
                print(f"Registro de uso creado con ID: {uso.id}")
                
                # Registrar el movimiento (el signal se encargará de actualizar el stock)
                print(f"Registrando movimiento de stock para {insumo.nombre}")
                movimiento = MovimientoInsumo.objects.create(
                    insumo=insumo,
                    cantidad=cantidad,
                    tipo_movimiento='salida',
                    motivo=f"Uso en ficha clínica #{ficha.id}",
                    usuario=usuario
                )
                print(f"Movimiento registrado con ID: {movimiento.id}")
                
            except (ValueError, TypeError) as e:
                print(f"Error procesando producto: {e} - Datos: {producto_data}")
                continue
            except Insumo.DoesNotExist:
                print(f"Insumo con ID {insumo_id} no encontrado")
                continue
        
        print("Creación de ficha clínica completada")
        return ficha

    def update(self, instance, validated_data):
        print("Iniciando actualización de ficha clínica")
        productos_usados_data = []
        
        # Extraer productos usados de los datos iniciales
        if 'productos_usados' in self.initial_data:
            productos_usados_data = self.initial_data.get('productos_usados', [])
            print(f"Procesando {len(productos_usados_data)} productos usados")
        else:
            print("No se recibieron productos usados en los datos iniciales")
            
        # Obtener usuario si está disponible en el contexto
        usuario = None
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            usuario = request.user
            print(f"Usuario autenticado: {usuario}")
        else:
            print("No hay usuario autenticado en el contexto")
        
        # Actualizar los campos básicos de la ficha primero
        print("Actualizando campos básicos de la ficha")
        for attr, value in validated_data.items():
            if attr != 'productos_usados':  # Excluir productos_usados
                setattr(instance, attr, value)
        instance.save()
        print("Campos básicos actualizados")
        
        from insumos.models import Insumo, MovimientoInsumo
        
        # Guardar los productos usados actuales para procesarlos después
        usos_anteriores = list(instance.productos_usados.all())
        print(f"Productos usados anteriores: {len(usos_anteriores)}")
        for uso in usos_anteriores:
            print(f"  - {uso.cantidad} unidades de {uso.insumo.nombre} (ID: {uso.insumo.id})")
        
        # Crear diccionario para los nuevos productos
        nuevos_productos = {}
        for producto_data in productos_usados_data:
            try:
                insumo_id = producto_data.get('insumo')
                cantidad = producto_data.get('cantidad', 0)
                
                # Asegurarse de que insumo_id sea un entero
                if not isinstance(insumo_id, int):
                    # Si es un objeto, intentar obtener su id
                    if hasattr(insumo_id, 'id'):
                        insumo_id = insumo_id.id
                    # Convertir a entero si es una cadena
                    else:
                        insumo_id = int(insumo_id)
                        
                nuevos_productos[insumo_id] = cantidad
                print(f"Producto para agregar: {insumo_id} - cantidad: {cantidad}")
            except (ValueError, TypeError) as e:
                print(f"Error procesando producto: {e} - Datos: {producto_data}")
                continue
        
        # Si no hay productos nuevos y no había productos anteriores, no hacer nada más
        if not nuevos_productos and not usos_anteriores:
            print("No hay productos para procesar, finalizando actualización")
            return instance
            
        # Primero verificar si hay suficiente stock para todos los nuevos productos
        for insumo_id, cantidad in nuevos_productos.items():
            try:
                insumo = Insumo.objects.get(id=insumo_id)
                
                # Calcular stock disponible considerando usos anteriores del mismo insumo
                stock_disponible = insumo.stock_actual
                for uso in usos_anteriores:
                    if uso.insumo.id == insumo_id:
                        stock_disponible += uso.cantidad
                
                print(f"Verificando stock para {insumo.nombre}: disponible {stock_disponible}, requerido {cantidad}")
                
                if stock_disponible < cantidad:
                    print(f"Stock insuficiente para {insumo.nombre}: disponible {stock_disponible}, requerido {cantidad}")
                    raise serializers.ValidationError({
                        "productos_usados": f"Stock insuficiente para {insumo.nombre}. Disponible: {stock_disponible}, Requerido: {cantidad}"
                    })
            except Insumo.DoesNotExist:
                print(f"Insumo con ID {insumo_id} no encontrado")
                raise serializers.ValidationError({
                    "productos_usados": f"No existe un insumo con ID {insumo_id}"
                })
        
        # Si hay suficiente stock para todos, proceder con la actualización
        print("Stock verificado para todos los productos, procediendo con la actualización")
        
        # Primero, devolver el stock de los productos anteriores (el signal no lo hará porque no estamos eliminando los registros)
        for uso_anterior in usos_anteriores:
            print(f"Devolviendo stock para {uso_anterior.insumo.nombre}: {uso_anterior.cantidad} unidades")
            # Registrar la devolución
            MovimientoInsumo.objects.create(
                insumo=uso_anterior.insumo,
                cantidad=uso_anterior.cantidad,
                tipo_movimiento='entrada',
                motivo=f"Devolución por edición de ficha clínica #{instance.id}",
                usuario=usuario
            )
        
        # Eliminar los productos usados anteriores
        print("Eliminando productos usados anteriores")
        instance.productos_usados.all().delete()
        
        # Procesar los nuevos productos usados
        print("Procesando nuevos productos usados")
        nuevos_usos = []
        for insumo_id, cantidad in nuevos_productos.items():
            insumo = Insumo.objects.get(id=insumo_id)
            print(f"Agregando {cantidad} unidades de {insumo.nombre}")
            
            # Crear el registro de uso de producto
            nuevo_uso = UsoProductoEnFicha(
                ficha=instance,
                insumo_id=insumo_id,
                cantidad=cantidad
            )
            nuevos_usos.append(nuevo_uso)
            
            # Registrar el movimiento (el signal se encargará de actualizar el stock)
            MovimientoInsumo.objects.create(
                insumo=insumo,
                cantidad=cantidad,
                tipo_movimiento='salida',
                motivo=f"Uso en ficha clínica #{instance.id} (editada)",
                usuario=usuario
            )
        
        # Crear todos los usos nuevos de una vez
        if nuevos_usos:
            UsoProductoEnFicha.objects.bulk_create(nuevos_usos)
            print(f"Creados {len(nuevos_usos)} registros de uso de productos")
        
        print("Actualización de ficha clínica completada")
        return instance