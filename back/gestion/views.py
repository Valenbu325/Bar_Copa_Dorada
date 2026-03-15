from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import Sede, Producto, Pedido, Inventario, Mesa, Empleado, Receta, DetallePedido
from .serializers import (
    SedeSerializer, ProductoSerializer, MesaSerializer, 
    InventarioSerializer, PedidoSerializer
)

# --- 👤 CREATE STAFF (ADMIN ONLY) ---
@api_view(['POST'])
def create_employee(request):
    data = request.data
    try:
        # 1. Create User
        username = data['email'].split('@')[0]
        user = User.objects.create_user(
            username=username,
            email=data['email'],
            password=data['password'],
            first_name=data['name']
        )
        # 2. Link to Employee Profile
        sede = Sede.objects.get(id=data['sedeId'])
        Empleado.objects.create(
            usuario=user,
            rol=data['role'],
            sede=sede
        )
        return Response({"message": "Staff created"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- 🔐 LOGIN REAL BY EMAIL ---
@api_view(['POST'])
@permission_classes([AllowAny])
def login_real(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Email not found"}, status=status.HTTP_404_NOT_FOUND)

    user = authenticate(username=user_obj.username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        role = 'waiter'
        sede_id = None
        sede_nombre = "Global Admin"

        if user.is_superuser:
            role = 'admin'
        
        try:
            empleado = Empleado.objects.get(usuario=user)
            if not user.is_superuser:
                role = empleado.rol.lower()
            if empleado.sede:
                sede_id = empleado.sede.id
                sede_nombre = empleado.sede.nombre
        except Empleado.DoesNotExist:
            if not user.is_superuser:
                return Response({"error": "No employee profile found"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "token": token.key,
            "name": f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            "role": role,
            "sedeId": sede_id,
            "sedeNombre": sede_nombre
        })
    return Response({"error": "Wrong password"}, status=status.HTTP_400_BAD_REQUEST)

# --- 📈 DASHBOARD STATS ---
@api_view(['GET'])
def dashboard_stats(request):
    today = timezone.now().date()
    revenue = Pedido.objects.filter(fecha_creacion__date=today).aggregate(Sum('total'))['total__sum'] or 0
    branches = Sede.objects.annotate(
        total_sales=Sum('mesa__pedido__total', filter=Q(mesa__pedido__fecha_creacion__date=today))
    ).values('nombre', 'total_sales')
    
    top_selling = DetallePedido.objects.values('producto__nombre').annotate(
        total_qty=Sum('cantidad')
    ).order_by('-total_qty')[:5]

    return Response({
        "revenue_today": revenue,
        "branch_performance": branches,
        "top_selling": top_selling
    })

# --- VIEWSETS ---
class SedeViewSet(viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer

class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.all()
    serializer_class = InventarioSerializer
    def get_queryset(self):
        queryset = Inventario.objects.all()
        sede_id = self.request.query_params.get('sede', None)
        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        return queryset

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    def create(self, request, *args, **kwargs):
        data = request.data
        mesa = Mesa.objects.get(id=data['mesa'])
        mesero = Empleado.objects.get(id=data['mesero'])
        pedido = Pedido.objects.create(mesa=mesa, mesero=mesero, total=data['total'])
        for item in data['items']:
            prod = Producto.objects.get(id=item['id'])
            DetallePedido.objects.create(pedido=pedido, producto=prod, cantidad=item['qty'], precio_unitario=prod.precio_venta)
            recetas = Receta.objects.filter(producto_final=prod)
            if recetas.exists():
                for r in recetas:
                    inv = Inventario.objects.get(producto=r.ingrediente, sede=mesa.sede)
                    inv.stock -= (r.cantidad_necesaria * item['qty'])
                    inv.save()
            else:
                inv = Inventario.objects.get(producto=prod, sede=mesa.sede)
                inv.stock -= item['qty']
                inv.save()
        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)