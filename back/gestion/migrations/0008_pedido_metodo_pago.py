from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0007_detallepedido_costo_compra_pedido_costo_total_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='metodo_pago',
            field=models.CharField(
                blank=True,
                choices=[('CASH', 'Efectivo'), ('CARD', 'Tarjeta')],
                help_text='Medio de pago al cerrar cuenta (facturación)',
                max_length=10,
                null=True,
            ),
        ),
    ]
