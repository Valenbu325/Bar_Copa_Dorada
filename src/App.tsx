import { useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

type Rol = 'Admin' | 'Mesero' | 'Cajero'

interface Mesa {
  id: number
  estado: 'Libre' | 'Ocupada' | 'Reservada'
  mesero: string
}

interface Pedido {
  id: string
  mesa: number
  estado: 'En cocina' | 'Listo' | 'Pagado'
  total: number
  metodoPago: 'Efectivo' | 'Tarjeta'
}

interface InventarioItem {
  nombre: string
  stock: number
  minimo: number
  unidad: string
}

interface NuevoPedido {
  mesa: number
  total: number
  metodoPago: 'Efectivo' | 'Tarjeta'
}

function App() {
  const [rolActivo, setRolActivo] = useState<Rol>('Admin')
  const [turnoAbierto, setTurnoAbierto] = useState(true)
  const [mesas, setMesas] = useState<Mesa[]>([
    { id: 1, estado: 'Libre', mesero: 'Valentina B' },
    { id: 2, estado: 'Ocupada', mesero: 'Laura V' },
    { id: 3, estado: 'Reservada', mesero: 'Yesica M' },
    { id: 4, estado: 'Ocupada', mesero: 'John N' },
    { id: 5, estado: 'Libre', mesero: 'Valentina B' },
    { id: 6, estado: 'Ocupada', mesero: 'Laura V' },
  ])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(2)
  const [pedidos, setPedidos] = useState<Pedido[]>([
    { id: 'PD-401', mesa: 2, estado: 'En cocina', total: 78000, metodoPago: 'Efectivo' },
    { id: 'PD-402', mesa: 4, estado: 'Listo', total: 52000, metodoPago: 'Tarjeta' },
    { id: 'PD-403', mesa: 6, estado: 'Pagado', total: 96000, metodoPago: 'Tarjeta' },
  ])
  const [inventario, setInventario] = useState<InventarioItem[]>([
    { nombre: 'Cerveza artesanal', stock: 24, minimo: 8, unidad: 'und' },
    { nombre: 'Carne para hamburguesa', stock: 8, minimo: 10, unidad: 'und' },
    { nombre: 'Papas fritas', stock: 12, minimo: 6, unidad: 'kg' },
    { nombre: 'Gaseosa 400ml', stock: 5, minimo: 8, unidad: 'und' },
  ])
  const [nuevoPedido, setNuevoPedido] = useState<NuevoPedido>({
    mesa: 2,
    total: 45000,
    metodoPago: 'Efectivo',
  })

  const resumen = useMemo(
    () => [
      {
        label: 'Ventas del dia',
        value: `$${pedidos
          .filter((p) => p.estado === 'Pagado')
          .reduce((acc, p) => acc + p.total, 0)
          .toLocaleString('es-CO')}`,
      },
      {
        label: 'Pedidos activos',
        value: `${pedidos.filter((p) => p.estado !== 'Pagado').length}`,
      },
      {
        label: 'Mesas ocupadas',
        value: `${mesas.filter((m) => m.estado === 'Ocupada').length} de ${mesas.length}`,
      },
      { label: 'Caja', value: turnoAbierto ? 'Abierta' : 'Cerrada' },
    ],
    [mesas, pedidos, turnoAbierto],
  )

  const menuBar = [
    'Dashboard',
    'Usuarios y roles',
    'Mesas',
    'Pedidos',
    'Inventario',
    'Facturacion',
    'Reportes CSV',
  ]

  const nivelStock = (item: InventarioItem) => {
    if (item.stock <= item.minimo * 0.6) return 'critico'
    if (item.stock < item.minimo) return 'bajo'
    return 'ok'
  }

  const cambiarEstadoMesa = (id: number) => {
    setMesas((prev) =>
      prev.map((mesa) => {
        if (mesa.id !== id) return mesa
        const siguiente =
          mesa.estado === 'Libre' ? 'Ocupada' : mesa.estado === 'Ocupada' ? 'Reservada' : 'Libre'
        return { ...mesa, estado: siguiente }
      }),
    )
  }

  const crearPedido = () => {
    const id = `PD-${400 + pedidos.length + 1}`
    const pedido: Pedido = {
      id,
      mesa: nuevoPedido.mesa,
      total: Number(nuevoPedido.total),
      metodoPago: nuevoPedido.metodoPago,
      estado: 'En cocina',
    }
    setPedidos((prev) => [pedido, ...prev])
  }

  const actualizarPedido = (id: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (p.estado === 'En cocina') return { ...p, estado: 'Listo' }
        if (p.estado === 'Listo') return { ...p, estado: 'Pagado' }
        return p
      }),
    )
  }

  const exportarCSV = () => {
    const rows = [
      ['id', 'mesa', 'estado', 'total', 'metodoPago'],
      ...pedidos.map((p) => [p.id, String(p.mesa), p.estado, String(p.total), p.metodoPago]),
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte-pedidos-copa-dorada.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app">
      <header className="hero card">
        <div className="hero-copy">
          <p className="kicker">Panel operativo</p>
          <h1>COPA DORADA</h1>
          <p className="subtitle">
            Sistema integral para bar-restaurante: usuarios, pedidos, inventario, facturacion y reportes.
          </p>
          <div className="role-switch">
            {(['Admin', 'Mesero', 'Cajero'] as Rol[]).map((rol) => (
              <button
                key={rol}
                type="button"
                className={`chip ${rolActivo === rol ? 'chip-active' : ''}`}
                onClick={() => setRolActivo(rol)}
              >
                {rol}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <button type="button" onClick={() => setTurnoAbierto((value) => !value)}>
              {turnoAbierto ? 'Cerrar turno' : 'Abrir turno'}
            </button>
            <button type="button" className="secondary" onClick={exportarCSV}>
              Exportar reporte CSV
            </button>
          </div>
        </div>
        <div className="hero-media">
          <img src={heroImg} width="240" height="240" alt="Marca COPA DORADA" />
          <p>Vista del bar y gestion centralizada del turno</p>
        </div>
      </header>

      <nav className="card nav-modules">
        {menuBar.map((modulo) => (
          <span key={modulo}>{modulo}</span>
        ))}
      </nav>

      <section className="stats-grid">
        {resumen.map((item) => (
          <article key={item.label} className="card stat-card">
            <p>{item.label}</p>
            <h2>{item.value}</h2>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="card">
          <h3>Estado de mesas</h3>
          <div className="mesas-grid">
            {mesas.map((mesa) => (
              <button
                key={mesa.id}
                type="button"
                className={`mesa ${mesaSeleccionada === mesa.id ? 'active' : ''}`}
                onClick={() => {
                  setMesaSeleccionada(mesa.id)
                  cambiarEstadoMesa(mesa.id)
                }}
              >
                <span>Mesa {mesa.id}</span>
                <small>{mesa.estado}</small>
                <small>{mesa.mesero}</small>
              </button>
            ))}
          </div>
          <p className="helper">
            Mesa seleccionada: {mesaSeleccionada}. Haz clic para cambiar estado (Libre/Ocupada/Reservada).
          </p>
        </article>

        <article className="card">
          <h3>Pedidos y facturacion</h3>
          <div className="form-order">
            <label>
              Mesa
              <select
                value={nuevoPedido.mesa}
                onChange={(e) =>
                  setNuevoPedido((prev) => ({ ...prev, mesa: Number(e.target.value) }))
                }
              >
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa {mesa.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Total
              <input
                type="number"
                min={1000}
                step={1000}
                value={nuevoPedido.total}
                onChange={(e) =>
                  setNuevoPedido((prev) => ({ ...prev, total: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              Pago
              <select
                value={nuevoPedido.metodoPago}
                onChange={(e) =>
                  setNuevoPedido((prev) => ({
                    ...prev,
                    metodoPago: e.target.value as 'Efectivo' | 'Tarjeta',
                  }))
                }
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </label>
            <button type="button" onClick={crearPedido}>
              Crear pedido
            </button>
          </div>
          <ul className="list">
            {pedidos.map((pedido) => (
              <li key={pedido.id}>
                <div>
                  <strong>{pedido.id}</strong>
                  <p>Mesa {pedido.mesa}</p>
                </div>
                <div>
                  <strong>${pedido.total.toLocaleString('es-CO')}</strong>
                  <p>
                    {pedido.estado} - {pedido.metodoPago}
                  </p>
                </div>
                <button type="button" className="secondary" onClick={() => actualizarPedido(pedido.id)}>
                  Avanzar
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Inventario clave</h3>
          <ul className="list inventory">
            {inventario.map((row, index) => (
              <li key={row.nombre}>
                <div>
                  <strong>{row.nombre}</strong>
                  <p>
                    {row.stock} {row.unidad}
                  </p>
                </div>
                <div className="inventory-actions">
                  <span className={`badge ${nivelStock(row)}`}>{nivelStock(row)}</span>
                  <button
                    type="button"
                    className="secondary tiny"
                    onClick={() =>
                      setInventario((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, stock: item.stock + 1 } : item)),
                      )
                    }
                  >
                    +1 stock
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card gallery">
        <h3>Ambientacion del bar</h3>
        <div className="gallery-grid">
          <img
            src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80"
            alt="Bar con iluminacion calida"
          />
          <img
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80"
            alt="Zona de barra con cocteles"
          />
          <img
            src="https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=1200&q=80"
            alt="Mesa de restaurante en horario nocturno"
          />
        </div>
      </section>
    </main>
  )
}

export default App
