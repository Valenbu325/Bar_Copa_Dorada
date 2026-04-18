INSERT INTO roles (code, name) VALUES
('ADMIN', 'Administrator'),
('WAITER', 'Waiter'),
('CASHIER', 'Cashier');

INSERT INTO branches (code, name, city) VALUES
('GAL', 'Galerias', 'Bogota'),
('RES', 'Restrepo', 'Bogota'),
('ZT', 'Zona T', 'Bogota');

INSERT INTO status_catalog (module, code, label) VALUES
('ORDER', 'OPEN', 'Open'),
('ORDER', 'CLOSED', 'Closed');

INSERT INTO payment_methods (code, label) VALUES
('CASH', 'Cash'),
('CREDIT_CARD', 'Credit card'),
('DEBIT_CARD', 'Debit card');

INSERT INTO users (full_name, email, password, role_id, branch_id)
SELECT 'Admin General', 'admin@copadorada.com', 'admin1234', r.id, b.id
FROM roles r, branches b
WHERE r.code = 'ADMIN' AND b.code = 'GAL';

INSERT INTO users (full_name, email, password, role_id, branch_id)
SELECT 'Mesero Principal', 'mesero@copadorada.com', 'mesero1234', r.id, b.id
FROM roles r, branches b
WHERE r.code = 'WAITER' AND b.code = 'RES';

INSERT INTO users (full_name, email, password, role_id, branch_id)
SELECT 'Cajero Central', 'cajero@copadorada.com', 'cajero1234', r.id, b.id
FROM roles r, branches b
WHERE r.code = 'CASHIER' AND b.code = 'ZT';

INSERT INTO categories (name) VALUES
('Beer'),
('Cocktail'),
('Food'),
('Supplies');

INSERT INTO products (sku, name, category_id, cost_price, sale_price)
SELECT 'PRD-BEER-01', 'Cerveza Importada', c.id, 3500, 8500 FROM categories c WHERE c.name = 'Beer';

INSERT INTO products (sku, name, category_id, cost_price, sale_price)
SELECT 'PRD-RUM-01', 'Ron Premium', c.id, 28000, 56000 FROM categories c WHERE c.name = 'Cocktail';

INSERT INTO products (sku, name, category_id, cost_price, sale_price)
SELECT 'PRD-NACH-01', 'Nachos de la Casa', c.id, 7500, 19000 FROM categories c WHERE c.name = 'Food';

INSERT INTO products (sku, name, category_id, cost_price, sale_price)
SELECT 'PRD-ICE-01', 'Hielo x Kg', c.id, 900, 2000 FROM categories c WHERE c.name = 'Supplies';

INSERT INTO inventory (branch_id, product_id, quantity)
SELECT b.id, p.id,
CASE
  WHEN b.code = 'GAL' AND p.sku = 'PRD-BEER-01' THEN 130
  WHEN b.code = 'RES' AND p.sku = 'PRD-RUM-01' THEN 44
  WHEN b.code = 'ZT' AND p.sku = 'PRD-ICE-01' THEN 220
  ELSE 35
END
FROM branches b
CROSS JOIN products p;

INSERT INTO bar_tables (branch_id, number)
SELECT b.id, t.number FROM branches b
CROSS JOIN (VALUES ('T-01'),('T-02'),('T-03'),('T-04'),('T-05')) AS t(number)
WHERE b.code IN ('GAL','RES','ZT');

INSERT INTO inventory_movements (branch_id, product_id, movement_type, quantity, reason, created_by)
SELECT b.id, p.id, 'IN', 30, 'Initial stock load', u.id
FROM branches b, products p, users u
WHERE b.code = 'GAL' AND p.sku = 'PRD-BEER-01' AND u.email = 'admin@copadorada.com';
