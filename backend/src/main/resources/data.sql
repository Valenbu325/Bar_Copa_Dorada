INSERT INTO sedes (nombre) VALUES ('Galerias'), ('Restrepo'), ('Zona T');

INSERT INTO usuarios (nombre, email, clave, rol, sede_id)
SELECT 'Admin General', 'admin@gmail.com', 'admin1234', 'Administrador', id FROM sedes WHERE nombre = 'Galerias';

INSERT INTO usuarios (nombre, email, clave, rol, sede_id)
SELECT 'Mesero Principal', 'mesero@copadorada.com', 'mesero1234', 'Mesero', id FROM sedes WHERE nombre = 'Restrepo';

INSERT INTO usuarios (nombre, email, clave, rol, sede_id)
SELECT 'Cajero Central', 'cajero@copadorada.com', 'cajero1234', 'Cajero', id FROM sedes WHERE nombre = 'Zona T';

INSERT INTO mesas (sede_id, numero, cupo, ocupada)
SELECT s.id, v.num, v.cupo, v.ocupada
FROM sedes s
CROSS JOIN (
  VALUES
    ('M1', 4, false),
    ('M2', 4, true),
    ('M3', 2, false)
) AS v(num, cupo, ocupada)
WHERE s.nombre = 'Galerias';

INSERT INTO mesas (sede_id, numero, cupo, ocupada)
SELECT s.id, v.num, v.cupo, v.ocupada
FROM sedes s
CROSS JOIN (
  VALUES
    ('R1', 4, false),
    ('R2', 6, false)
) AS v(num, cupo, ocupada)
WHERE s.nombre = 'Restrepo';

INSERT INTO mesas (sede_id, numero, cupo, ocupada)
SELECT s.id, v.num, v.cupo, v.ocupada
FROM sedes s
CROSS JOIN (
  VALUES
    ('Z1', 4, false)
) AS v(num, cupo, ocupada)
WHERE s.nombre = 'Zona T';

INSERT INTO pedidos (sede_id, mesa_id, cliente, items, total, estado, metodo_pago)
SELECT s.id, m.id, 'Cliente demo', 'Cerveza x2, nachos', 45000.00, 'Abierto', 'Efectivo'
FROM sedes s
JOIN mesas m ON m.sede_id = s.id AND m.numero = 'M2'
WHERE s.nombre = 'Galerias';

INSERT INTO inventario (sede_id, producto, cantidad, unidad)
SELECT id, 'Cerveza importada', 120, 'botella' FROM sedes WHERE nombre = 'Galerias';

INSERT INTO inventario (sede_id, producto, cantidad, unidad)
SELECT id, 'Ron premium', 40, 'botella' FROM sedes WHERE nombre = 'Restrepo';

INSERT INTO inventario (sede_id, producto, cantidad, unidad)
SELECT id, 'Hielo', 200, 'kg' FROM sedes WHERE nombre = 'Zona T';
