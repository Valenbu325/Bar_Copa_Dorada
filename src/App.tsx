import { useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [turnoAbierto, setTurnoAbierto] = useState(true)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(4)

  const resumen = useMemo(
    () => [
      { label: 'Ventas del dia', value: '$1.250.000' },
      { label: 'Pedidos activos', value: '12' },
      { label: 'Mesas ocupadas', value: '8 de 15' },
      { label: 'Caja', value: turnoAbierto ? 'Abierta' : 'Cerrada' },
    ],
    [turnoAbierto],
  )

  const mesas = [
    { numero: 1, estado: 'Libre' },
    { numero: 2, estado: 'Ocupada' },
    { numero: 3, estado: 'Reservada' },
    { numero: 4, estado: 'Ocupada' },
    { numero: 5, estado: 'Libre' },
    { numero: 6, estado: 'Ocupada' },
  ]

  const pedidosRecientes = [
    { id: 'PD-201', mesa: 2, total: '$78.000', estado: 'En cocina' },
    { id: 'PD-202', mesa: 4, total: '$52.000', estado: 'Listo para entregar' },
    { id: 'PD-203', mesa: 6, total: '$96.000', estado: 'Pagado' },
  ]

  const inventario = [
    { item: 'Cerveza artesanal', stock: '24 und', nivel: 'OK' },
    { item: 'Carne para hamburguesa', stock: '8 und', nivel: 'Bajo' },
    { item: 'Papas fritas', stock: '12 kg', nivel: 'OK' },
    { item: 'Gaseosa 400ml', stock: '5 und', nivel: 'Critico' },
  ]

  return (
    <main className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="kicker">Panel operativo</p>
          <h1>COPA DORADA</h1>
          <p className="subtitle">
            Gestion de mesas, pedidos e inventario en tiempo real para el turno actual.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => setTurnoAbierto((value) => !value)}>
              {turnoAbierto ? 'Cerrar turno' : 'Abrir turno'}
            </button>
            <button type="button" className="secondary">
              Registrar venta
            </button>
          </div>
        </div>
        <div className="hero-media">
          <img src={heroImg} width="240" height="240" alt="Marca COPA DORADA" />
        </div>
      </header>

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
                key={mesa.numero}
                type="button"
                className={`mesa ${mesaSeleccionada === mesa.numero ? 'active' : ''}`}
                onClick={() => setMesaSeleccionada(mesa.numero)}
              >
                <span>Mesa {mesa.numero}</span>
                <small>{mesa.estado}</small>
              </button>
            ))}
          </div>
          <p className="helper">Mesa seleccionada: {mesaSeleccionada}</p>
        </article>

        <article className="card">
          <h3>Pedidos recientes</h3>
          <ul className="list">
            {pedidosRecientes.map((pedido) => (
              <li key={pedido.id}>
                <div>
                  <strong>{pedido.id}</strong>
                  <p>Mesa {pedido.mesa}</p>
                </div>
                <div>
                  <strong>{pedido.total}</strong>
                  <p>{pedido.estado}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Inventario clave</h3>
          <ul className="list inventory">
            {inventario.map((row) => (
              <li key={row.item}>
                <div>
                  <strong>{row.item}</strong>
                  <p>{row.stock}</p>
                </div>
                <span className={`badge ${row.nivel.toLowerCase()}`}>{row.nivel}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
