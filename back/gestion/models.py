from django.db import models
from django.contrib.auth.models import User

# --- 🏢 TABLA DE SEDES ---
class Sede(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    direccion = models.CharField(max_length=200, blank=True, null=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

# --- 👥 TABLA DE EMPLEADOS / PERFILES ---
class Empleado(models.Model):
    OPCIONES_ROL = (
        ('admin', 'Administrador'),
        ('cashier', 'Cajero'),
        ('waiter', 'Mesero'),
    )
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=OPCIONES_ROL, default='waiter')
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.usuario.username} ({self.rol}) - {self.sede.nombre if self.sede else 'Global'}"

# --- 🪑 TABLA DE MESAS ---
class Mesa(models.Model):
    numero = models.IntegerField()
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE)
    capacidad = models.IntegerField(default=4)
    activa = models.BooleanField(default=True) # True = Libre, False = Ocupada o Deshabilitada

    def __str__(self):
        return f"Mesa {self.numero} - {self.sede.nombre}"

# --- 📦 TABLA DE PRODUCTOS / INGREDIENTES ---
class Producto(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=100) # Ej: Bebidas, Comida, Insumos
    costo_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    es_insumo = models.BooleanField(default=False) # True si es un ingrediente (ej: Sal), False si es venta directa (ej: Cerveza)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

# --- 📊 TABLA DE INVENTARIO (POR SEDE) ---
class Inventario(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE)
    stock = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5) # Para la alerta de "Cantidad mínima"

    class Meta:
        unique_together = ('producto', 'sede')

    def __str__(self):
        return f"{self.producto.nombre} en {self.sede.nombre}: {self.stock}"

# --- 📖 TABLA DE RECETAS (CONEXIÓN PLATO-INGREDIENTE) ---
class Receta(models.Model):
    producto_final = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='ingredientes')
    ingrediente = models.ForeignKey(Producto, on_delete=models.CASCADE, limit_choices_to={'es_insumo': True})
    cantidad_necesaria = models.IntegerField(default=1)

# --- 💰 TABLAS DE PEDIDOS ---
class Pedido(models.Model):
    ESTADOS = (
        ('OPEN', 'Open'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    )
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE)
    mesero = models.ForeignKey(Empleado, on_delete=models.RESTRICT, related_name='pedidos_tomados')
    cajero = models.ForeignKey(Empleado, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas_cerradas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='OPEN')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    METODOS_PAGO = (
        ('CASH', 'Efectivo'),
        ('CARD', 'Tarjeta'),
    )
    metodo_pago = models.CharField(
        max_length=10,
        choices=METODOS_PAGO,
        blank=True,
        null=True,
        help_text='Medio de pago al cerrar cuenta (facturación)',
    )

    @property
    def ganancia_total(self):
        return self.total - self.costo_total

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.RESTRICT)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    costo_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def ganancia_total(self):
        return (self.precio_unitario - self.costo_compra) * self.cantidad