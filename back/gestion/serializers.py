from rest_framework import serializers
from .models import Sede, Producto, Empleado, Mesa, Pedido, DetallePedido

# Traductor para Sedes
class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = '__all__'

# Traductor para Productos (Ideal para el inventario en el Front)
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# Traductor para Mesas
class MesaSerializer(serializers.ModelSerializer):
    # Aquí le decimos qué sede es, trayendo el nombre
    sede_nombre = serializers.ReadOnlyField(source='sede.nombre')
    class Meta:
        model = Mesa
        fields = ['id', 'numero', 'sede', 'sede_nombre', 'capacidad', 'activa']

# Traductor para Pedidos (El corazón del sistema)
class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = '__all__'