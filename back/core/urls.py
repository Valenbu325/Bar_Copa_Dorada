from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gestion.views import (
    SedeViewSet, ProductoViewSet, PedidoViewSet,
    InventarioViewSet, MesaViewSet, login_real,
    dashboard_stats, create_employee, list_staff, get_table_order, pay_order, reporte_ventas, reporte_fechas_disponibles,
)

router = DefaultRouter()
router.register(r'sedes', SedeViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'inventario', InventarioViewSet)
router.register(r'mesas', MesaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', login_real),
    path('api/reports/dashboard/', dashboard_stats),
    path('api/reports/fechas-disponibles/', reporte_fechas_disponibles),
    path('api/reports/ventas/', reporte_ventas),
    path('api/staff/create/', create_employee),
    path('api/staff/', list_staff),
    path('api/mesas/<int:mesa_id>/pedido-activo/', get_table_order),
    path('api/pedidos/<int:pedido_id>/pay/', pay_order),
    path('api/', include(router.urls)),
]