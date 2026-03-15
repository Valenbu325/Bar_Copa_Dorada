from rest_framework import viewsets
from .models import Sede, Producto, Pedido
from .serializers import SedeSerializer, ProductoSerializer, PedidoSerializer

# Esta clase maneja automáticamente GET (leer), POST (crear), PUT (editar) y DELETE (borrar)
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class SedeViewSet(viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer