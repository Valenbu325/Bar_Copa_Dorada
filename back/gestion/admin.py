from django.contrib import admin
# Importamos todas las tablas que creamos en models.py
from .models import Sede, Empleado, Mesa, Producto, Inventario, Pedido, DetallePedido

# Registramos cada tabla para que aparezca en el panel de administrador
admin.site.register(Sede)
admin.site.register(Empleado)
admin.site.register(Mesa)
admin.site.register(Producto)
admin.site.register(Inventario)
admin.site.register(Pedido)
admin.site.register(DetallePedido)