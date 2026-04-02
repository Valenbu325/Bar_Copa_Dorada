from rest_framework import serializers
from .models import Sede, Producto, Empleado, Mesa, Pedido, DetallePedido, Inventario, Receta

class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = '__all__'

class EmpleadoSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='usuario.username')
    sede_nombre = serializers.ReadOnlyField(source='sede.nombre')
    class Meta:
        model = Empleado
        fields = ['id', 'username', 'rol', 'sede', 'sede_nombre']

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# --- EL QUE FALTABA ---
class MesaSerializer(serializers.ModelSerializer):
    sede_nombre = serializers.ReadOnlyField(source='sede.nombre')
    class Meta:
        model = Mesa
        fields = ['id', 'numero', 'sede', 'sede_nombre', 'capacidad', 'activa']

class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    alerta_stock = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = ['id', 'producto', 'producto_nombre', 'sede', 'stock', 'stock_minimo', 'alerta_stock']

    def get_alerta_stock(self, obj):
        return obj.stock <= obj.stock_minimo

class RecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receta
        fields = '__all__'

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    class Meta:
        model = DetallePedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_unitario', 'costo_compra']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    ganancia_total = serializers.SerializerMethodField()
    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'mesero', 'cajero', 'fecha_creacion', 'fecha_cierre', 'estado', 'total', 'costo_total', 'ganancia_total', 'detalles']

    def get_ganancia_total(self, obj):
        return float(obj.ganancia_total)