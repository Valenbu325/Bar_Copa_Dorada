from django.db import models
from django.contrib.auth.models import User

# --- TABLA DE SEDES ---
class Sede(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre de la Sede")
    direccion = models.CharField(max_length=200, blank=True, null=True, verbose_name="Dirección")
    activa = models.BooleanField(default=True, verbose_name="¿Sede Activa?")

    def __str__(self):
        return self.nombre


# --- TABLA DE EMPLEADOS / ROLES ---
class Empleado(models.Model):
    OPCIONES_ROL = (
        ('ADMIN', 'Administrador'),
        ('CAJERO', 'Cajero'),
        ('MESERO', 'Mesero'),
    )

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name="Usuario del Sistema")
    rol = models.CharField(max_length=20, choices=OPCIONES_ROL, default='MESERO', verbose_name="Rol en el Bar")
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Sede Asignada")

    def __str__(self):
        return f"{self.usuario.username} - {self.rol}"
    
    # --- TABLA DE MESAS ---
class Mesa(models.Model):
    # Número de la mesa (Ej: Mesa 1, Mesa 2)
    numero = models.IntegerField(verbose_name="Número de Mesa")
    
    # Conectamos la mesa a una Sede específica. CASCADE significa que si se borra la sede, se borran sus mesas.
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, verbose_name="Sede a la que pertenece")
    
    capacidad = models.IntegerField(default=4, verbose_name="Capacidad de personas")
    activa = models.BooleanField(default=True, verbose_name="¿Mesa Activa?")

    def __str__(self):
        return f"Mesa {self.numero} - {self.sede.nombre}"


# --- TABLA DE PRODUCTOS ---
class Producto(models.Model):
    # Código único para el producto, útil para el reporte CSV
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código del Producto")
    nombre = models.CharField(max_length=150, verbose_name="Nombre del Producto")
    categoria = models.CharField(max_length=100, verbose_name="Categoría (Ej: Cervezas, Licores)")
    
    # DecimalField es ideal para dinero. max_digits=10 permite precios altos, decimal_places=2 guarda los centavos.
    costo_compra = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo de Compra")
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio de Venta")
    
    activo = models.BooleanField(default=True, verbose_name="¿Producto Activo?")

    def __str__(self):
        return f"[{self.codigo}] {self.nombre}"
    
    # --- TABLA DE INVENTARIO ---
class Inventario(models.Model):
    # Conectamos con el producto y con la sede
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, verbose_name="Producto")
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, verbose_name="Sede")
    
    # Aquí guardamos la cantidad real que hay en el bar
    stock = models.IntegerField(default=0, verbose_name="Cantidad en Stock")

    class Meta:
        # Esto es un truco de seguridad: evita que por error registremos 
        # dos veces el mismo producto en la misma sede.
        unique_together = ('producto', 'sede')

    def __str__(self):
        return f"{self.producto.nombre} - {self.sede.nombre} (Stock: {self.stock})"
    

    # --- TABLAS DE PEDIDOS Y FACTURACIÓN ---

class Pedido(models.Model):
    # Los estados los ponemos en inglés pensando en tu interfaz frontal
    ESTADOS = (
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    )
    
    # Conectamos con la mesa y el mesero que toma el pedido
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE, verbose_name="Mesa")
    
    # related_name nos ayuda a diferenciar entre el mesero que atiende y el cajero que cobra
    mesero = models.ForeignKey(Empleado, on_delete=models.RESTRICT, related_name='pedidos_mesero', verbose_name="Mesero")
    
    # El cajero puede estar vacío (null=True) mientras el pedido siga abierto
    cajero = models.ForeignKey(Empleado, on_delete=models.SET_NULL, null=True, blank=True, related_name='pedidos_cajero', verbose_name="Cajero")
    
    # auto_now_add=True guarda automáticamente la fecha y hora exacta en la que se crea el pedido
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_cierre = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Cierre")
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='OPEN', verbose_name="Estado del Pedido")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Total del Pedido")

    def __str__(self):
        return f"Order {self.id} - Table {self.mesa.numero} ({self.estado})"


class DetallePedido(models.Model):
    # Conectamos el producto con su pedido general
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles', verbose_name="Pedido")
    producto = models.ForeignKey(Producto, on_delete=models.RESTRICT, verbose_name="Producto")
    
    cantidad = models.IntegerField(default=1, verbose_name="Cantidad")
    # Guardamos el precio en ese momento, por si en el futuro el administrador cambia los precios
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario")

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} (Order {self.pedido.id})"