from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gestion.views import SedeViewSet, ProductoViewSet, PedidoViewSet

# Creamos un router que genera las URLs automáticamente
router = DefaultRouter()
router.register(r'sedes', SedeViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'pedidos', PedidoViewSet)

urlpatterns = [
    path('admin/', admin.site.register),
    path('api/', include(router.urls)), # Todas nuestras rutas empezarán con /api/
]