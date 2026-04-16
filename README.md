# Copa Dorada - Smart Bar Management System

MVP empresarial desarrollado por Pragma Dev Studio para gestionar operaciones multi-sede de un bar en Bogota.

## Stack oficial

- Frontend: React + TypeScript + Vite
- Backend: Java + Spring Boot + Spring JDBC + Maven
- Database: PostgreSQL (Docker)

## Arquitectura backend

- Estructura: `controller/`, `service/`, `repository/`, `dto/`, `util/`
- Flujo: `Controller -> Service -> Repository -> Database`

## Base de datos normalizada

Tablas implementadas:

- Core: `users`, `roles`, `branches`
- Catalogo producto: `products`, `categories`
- Inventario: `inventory`, `inventory_movements`
- Ordenes: `orders`, `order_details`
- Pagos: `payments`, `payment_methods`
- Soporte empresarial: `audit_logs`, `status_catalog`

## Endpoints principales MVP

- Auth:
  - `POST /api/auth/login`
- Lookups:
  - `GET /api/branches`
  - `GET /api/roles`
- Users:
  - `GET /api/users`
  - `POST /api/users`
- Inventory y products:
  - `GET /api/products?sort=price`
  - `POST /api/products`
  - `GET /api/inventory?branchId=...`
  - `POST /api/inventory/movements`
- Orders:
  - `GET /api/orders?branchId=...`
  - `POST /api/orders`
  - `PUT /api/orders/{id}/close`
- Reports:
  - `GET /api/reports`
- Internal (opcional tecnico):
  - `GET /api/internal/hanoi?n=3`

## Algoritmos integrados (no visibles en UI)

- Sorting: MergeSort en listados de productos y ranking de ventas.
- Iterativo: calculos de totales y agregaciones de reportes.
- Recursivo: sumatoria interna y endpoint tecnico de Hanoi.

## Frontend ERP (Odoo + Shopify reference)

- Sidebar navegacion
- Topbar con usuario + branch + toggle tema
- Paginas: Dashboard, Users, Inventory, Orders, Reports
- Cards KPI: Total Sales, Total Orders, Total Products, Active Orders
- Tablas limpias y responsivas
- Tema dorado Copa Dorada con modo claro/oscuro persistido en `localStorage`

## Credenciales demo

- Admin: `admin@copadorada.com / admin1234`
- Waiter: `mesero@copadorada.com / mesero1234`
- Cashier: `cajero@copadorada.com / cajero1234`

## Ejecucion local paso a paso

Requisitos:

- Node.js 20+
- npm 10+
- Java 21
- Maven 3.9+
- Docker Desktop activo

1. Instalar dependencias frontend:

```bash
npm install
```

2. Reiniciar base con semilla:

```bash
docker compose down -v
docker compose up -d
```

3. Levantar backend:

```bash
cd backend
mvn spring-boot:run
```

4. Levantar frontend (otra terminal):

```bash
npm run dev
```

5. Validar calidad tecnica:

```bash
npm run lint
npm run build
```

## Hardening final (roles/permisos)

Matriz operativa:

- `ADMIN`:
  - Acceso completo a todos los modulos.
  - Puede cambiar de branch desde topbar.
- `WAITER`:
  - Crea ordenes en su propia branch.
  - No puede cerrar ordenes ni gestionar inventario.
- `CASHIER`:
  - Gestiona movimientos de inventario en su propia branch.
  - Cierra ordenes con metodo de pago.
  - Puede crear ordenes operativas en su branch.

Reglas protegidas:

- Una orden `CLOSED` no se puede modificar.
- Movimientos de inventario `OUT` validan stock disponible.
- Usuarios no-admin operan solo sobre su branch.

## Pruebas rapidas de verificacion

1. Login con cada rol demo.
2. Como `WAITER`:
   - Crear una orden en Orders.
   - Confirmar que aparece en tabla del branch.
3. Como `CASHIER`:
   - Registrar un movimiento `IN` o `OUT` en Inventory.
   - Cerrar una orden `OPEN` en Orders.
4. Como `ADMIN`:
   - Ver dashboard y reportes globales.
   - Crear usuario y producto.

## Guion de demo (entrega)

1. Mostrar login y cambio de tema claro/oscuro.
2. Ingresar como `WAITER` y crear orden en tiempo real.
3. Ingresar como `CASHIER` y cerrar esa orden con pago.
4. Mostrar `Reports` con ranking de ventas por branch.
5. Mostrar trazabilidad de inventario por movimientos.
6. Cerrar con explicacion de arquitectura limpia y DB normalizada.
