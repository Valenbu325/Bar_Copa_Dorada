from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db.models import Sum, Count, Q
from django.db import transaction
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
        username = data['email'].split('@')[0]
        user = User.objects.create_user(
            username=username,
            email=data['email'],
            password=data['password'],
            first_name=data['name']
        )
        sede = Sede.objects.get(id=data['sedeId'])
        Empleado.objects.create(
            usuario=user,
            rol=data['role'],
            sede=sede
        )
        return Response({"message": "Staff created successfully"}, status=status.HTTP_201_CREATED)
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
            "empleadoId": empleado.id if 'empleado' in locals() else None,
            "sedeId": sede_id,
            "sedeNombre": sede_nombre
        })
    return Response({"error": "Wrong password"}, status=status.HTTP_400_BAD_REQUEST)

# --- 📈 DASHBOARD STATS ---
@api_view(['GET'])
def dashboard_stats(request):
    today = timezone.now().date()
    # Filtramos por pedidos pagados para reportar ingresos reales
    revenue = Pedido.objects.filter(fecha_creacion__date=today, estado='PAID').aggregate(Sum('total'))['total__sum'] or 0
    
    # Corregido el filtro Q y la referencia a modelos
    branches = Sede.objects.annotate(
        total_sales=Sum('mesa__pedido__total', filter=Q(mesa__pedido__fecha_creacion__date=today, mesa__pedido__estado='PAID'))
    ).values('nombre', 'total_sales')
    
    top_selling = DetallePedido.objects.filter(pedido__estado='PAID').values('producto__nombre').annotate(
        total_qty=Sum('cantidad')
    ).order_by('-total_qty')[:5]

    return Response({
        "revenue_today": revenue,
        "branch_performance": branches,
        "top_selling": top_selling
    })

# --- BUSCAR PEDIDO ACTIVO DE UNA MESA ---
@api_view(['GET'])
def get_table_order(request, mesa_id):
    try:
        pedido = Pedido.objects.filter(mesa_id=mesa_id, estado='OPEN').last()
        if not pedido:
            return Response({"pedido_id": None, "items": [], "total": 0})
        
        detalles = DetallePedido.objects.filter(pedido=pedido)
        items = [{
            "id": d.producto.id,
            "nombre": d.producto.nombre,
            "qty": d.cantidad,
            "precio_venta": d.precio_unitario
        } for d in detalles]
        
        return Response({
            "pedido_id": pedido.id, 
            "items": items, 
            "total": pedido.total
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# --- FECHAS DISPONIBLES CON VENTAS (para calendarios en reportes) ---
@api_view(['GET'])
def reporte_fechas_disponibles(request):
    from datetime import datetime
    
    try:
        sede_id = request.query_params.get('sede_id')
        
        query = Pedido.objects.filter(estado='PAID').values('fecha_cierre__date').distinct().order_by('fecha_cierre__date')
        
        if sede_id:
            query = query.filter(mesa__sede_id=sede_id)
        
        fechas = [item['fecha_cierre__date'].isoformat() for item in query]
        
        return Response({
            "fechas_disponibles": fechas,
            "total_fechas": len(fechas)
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# --- REPORTE DE VENTAS MEJORADO (CSV con más columnas) ---
@api_view(['GET'])
def reporte_ventas(request):
    from datetime import datetime, timedelta
    import csv
    from django.http import HttpResponse
    
    fecha_inicio = request.query_params.get('fecha_inicio')
    fecha_fin = request.query_params.get('fecha_fin')
    sede_id = request.query_params.get('sede_id')
    
    try:
        if not fecha_inicio or not fecha_fin:
            return Response({"error": "Especifica fecha_inicio y fecha_fin en formato YYYY-MM-DD"}, status=400)
        
        fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date() + timedelta(days=1)
        
        query = Pedido.objects.filter(
            estado='PAID',
            fecha_cierre__date__gte=fecha_inicio,
            fecha_cierre__date__lt=fecha_fin
        ).select_related('mesa__sede', 'mesero__usuario', 'cajero__usuario').prefetch_related('detalles__producto')
        
        if sede_id:
            query = query.filter(mesa__sede_id=sede_id)
        
        rows = []
        for pedido in query:
            # Obtener código de mesa formateado (G-01, R-01, ZT-01, etc.)
            sede = pedido.mesa.sede
            sede_prefijo_map = {
                'Galerías': 'G',
                'Restrepo': 'R',
                'Zona T': 'ZT'
            }
            prefijo = sede_prefijo_map.get(sede.nombre, 'XX')
            table_code = f"{prefijo}-{pedido.mesa.numero:02d}"
            
            # Nombres de empleados
            nombre_mesero = pedido.mesero.usuario.first_name or pedido.mesero.usuario.username if pedido.mesero else "N/A"
            nombre_cajero = pedido.cajero.usuario.first_name or pedido.cajero.usuario.username if pedido.cajero else "N/A"
            
            # Hora de cierre
            hora_cierre = pedido.fecha_cierre.strftime('%H:%M:%S') if pedido.fecha_cierre else "N/A"
            
            for detalle in pedido.detalles.all():
                ganancia = (detalle.precio_unitario - detalle.costo_compra) * detalle.cantidad
                rows.append({
                    'fecha': pedido.fecha_cierre.strftime('%Y-%m-%d'),
                    'hora_cierre': hora_cierre,
                    'mesa_numero': pedido.mesa.numero,
                    'table_code': table_code,
                    'sede': sede.nombre,
                    'nombre_mesero': nombre_mesero,
                    'nombre_cajero': nombre_cajero,
                    'codigo_producto': detalle.producto.codigo,
                    'nombre_producto': detalle.producto.nombre,
                    'cantidad': detalle.cantidad,
                    'precio_unitario': float(detalle.precio_unitario),
                    'costo_compra': float(detalle.costo_compra),
                    'subtotal': float(detalle.precio_unitario * detalle.cantidad),
                    'ganancia': float(ganancia),
                    'margen_%': round((ganancia / (detalle.precio_unitario * detalle.cantidad) * 100) if detalle.precio_unitario * detalle.cantidad > 0 else 0, 2)
                })
        
        # Nombres de campos en orden lógico
        fieldnames = [
            'fecha', 'hora_cierre', 'mesa_numero', 'table_code', 'sede', 
            'nombre_mesero', 'nombre_cajero', 'codigo_producto', 'nombre_producto', 
            'cantidad', 'precio_unitario', 'costo_compra', 'subtotal', 'ganancia', 'margen_%'
        ]
        
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="reporte_ventas_{fecha_inicio}_{fecha_fin}.csv"'
        
        # Agregar BOM para Excel reconozca UTF-8
        response.write('\ufeff')
        
        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
        return response
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# --- CERRAR CUENTA (PAGO) ---
@api_view(['POST'])
def pay_order(request, pedido_id):
    try:
        with transaction.atomic():
            pedido = Pedido.objects.select_related('mesa').get(id=pedido_id)
            cajero_id = request.data.get('cajero_id')
            
            if cajero_id:
                cajero = Empleado.objects.get(id=cajero_id)
                pedido.cajero = cajero
            
            pedido.estado = 'PAID'
            pedido.fecha_cierre = timezone.now()
            pedido.save()
            
            mesa = pedido.mesa
            mesa.activa = True
            mesa.save()
        
        return Response({"message": "Account closed successfully", "ganancia": float(pedido.ganancia_total)})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# --- VIEWSETS STANDARD ---
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
        if sede_id: queryset = queryset.filter(sede_id=sede_id)
        return queryset

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    def create(self, request, *args, **kwargs):
        data = request.data
        try:
            with transaction.atomic():
                mesa = Mesa.objects.select_for_update().get(id=data['mesa'])
                mesero = Empleado.objects.get(id=data['mesero'])
                items = data.get('items', [])

                if not items:
                    return Response({"error": "No se enviaron items"}, status=status.HTTP_400_BAD_REQUEST)

                pedido = Pedido.objects.filter(mesa=mesa, estado='OPEN').order_by('-fecha_creacion').first()
                if not pedido:
                    mesa.activa = False
                    mesa.save()
                    pedido = Pedido.objects.create(mesa=mesa, mesero=mesero, total=Decimal('0.00'), estado='OPEN')

                inventory_deltas = {}
                detail_rows = []
                order_total = Decimal('0.00')
                costo_total = Decimal('0.00')

                for item in items:
                    prod = Producto.objects.get(id=item['id'])
                    qty = int(item['qty'])
                    if qty <= 0:
                        return Response({"error": "Cantidad inválida"}, status=status.HTTP_400_BAD_REQUEST)

                    price = Decimal(str(prod.precio_venta))
                    cost = Decimal(str(prod.costo_compra))
                    order_total += price * qty
                    costo_total += cost * qty
                    detail_rows.append((prod, qty, price, cost))

                    recetas = list(Receta.objects.filter(producto_final=prod).select_related('ingrediente'))
                    if recetas:
                        for receta in recetas:
                            key = (receta.ingrediente_id, mesa.sede_id)
                            inventory_deltas[key] = inventory_deltas.get(key, 0) + (receta.cantidad_necesaria * qty)
                    else:
                        key = (prod.id, mesa.sede_id)
                        inventory_deltas[key] = inventory_deltas.get(key, 0) + qty

                for (producto_id, sede_id), required_qty in inventory_deltas.items():
                    try:
                        inv = Inventario.objects.select_for_update().get(producto_id=producto_id, sede_id=sede_id)
                    except Inventario.DoesNotExist:
                        producto = Producto.objects.get(id=producto_id)
                        return Response({"error": f"No hay inventario para {producto.nombre} en la sede"}, status=status.HTTP_400_BAD_REQUEST)

                    if inv.stock < required_qty:
                        return Response({"error": f"Stock insuficiente para {inv.producto.nombre}"}, status=status.HTTP_400_BAD_REQUEST)

                for prod, qty, price, cost in detail_rows:
                    DetallePedido.objects.create(
                        pedido=pedido,
                        producto=prod,
                        cantidad=qty,
                        precio_unitario=price,
                        costo_compra=cost
                    )

                for (producto_id, sede_id), required_qty in inventory_deltas.items():
                    inv = Inventario.objects.select_for_update().get(producto_id=producto_id, sede_id=sede_id)
                    inv.stock -= required_qty
                    inv.save()

                pedido.total = (pedido.total or Decimal('0.00')) + order_total
                pedido.costo_total = (pedido.costo_total or Decimal('0.00')) + costo_total
                pedido.mesero = mesero
                pedido.save()

            return Response({"status": "ok", "pedido_id": pedido.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=400)