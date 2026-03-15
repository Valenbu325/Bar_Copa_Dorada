from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Sede, Producto, Empleado, Mesa, Inventario, Receta

# Esto hace que el Empleado se pueda editar DENTRO del Usuario
class EmpleadoInline(admin.StackedInline):
    model = Empleado
    can_delete = False
    verbose_name_plural = 'Información de Empleado (Rol y Sede)'

class UserAdmin(BaseUserAdmin):
    inlines = (EmpleadoInline,)

# Re-registramos el Usuario con la nueva interfaz
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Registramos el resto de tablas normales
admin.site.register(Sede)
admin.site.register(Producto)
admin.site.register(Mesa)
admin.site.register(Inventario)
admin.site.register(Receta)