import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

type Rol = 'Administrador' | 'Mesero' | 'Cajero'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  sede: string
}

interface Mesa {
  id: number
  sede: string
  numero: string
  cupo: number
  ocupada: boolean
}

interface Pedido {
  id: number
  sede: string
  mesa: string
  cliente: string
  items: string
  total: number
  estado: string
  metodoPago: string
}

interface InventarioItem {
  id: number
  sede: string
  producto: string
  cantidad: number
  unidad: string
}

type Modulo = 'panel' | 'mesas' | 'pedidos' | 'inventario' | 'analisis'

function quickSortRecursive(arr: number[]): number[] {
  if (arr.length <= 1) return [...arr]
  const pivot = arr[Math.floor(arr.length / 2)]
  const left: number[] = []
  const mid: number[] = []
  const right: number[] = []
  for (const n of arr) {
    if (n < pivot) left.push(n)
    else if (n > pivot) right.push(n)
    else mid.push(n)
  }
  return [...quickSortRecursive(left), ...mid, ...quickSortRecursive(right)]
}

function insertionSortCantidad(items: InventarioItem[]): InventarioItem[] {
  const out = [...items]
  for (let i = 1; i < out.length; i++) {
    const key = out[i]
    let j = i - 1
    while (j >= 0 && out[j].cantidad > key.cantidad) {
      out[j + 1] = out[j]
      j--
    }
    out[j + 1] = key
  }
  return out
}

function sumaRecursiva(arr: number[], i = 0): number {
  if (i >= arr.length) return 0
  return arr[i] + sumaRecursiva(arr, i + 1)
}

function modulosPorRol(rol: Rol): Modulo[] {
  switch (rol) {
    case 'Administrador':
      return ['panel', 'mesas', 'pedidos', 'inventario', 'analisis']
    case 'Mesero':
      return ['panel', 'mesas', 'pedidos']
    case 'Cajero':
      return ['panel', 'pedidos', 'inventario']
    default:
      return ['panel']
  }
}

export default function App() {
  const [temaOscuro, setTemaOscuro] = useState(true)
  const [sesion, setSesion] = useState<Usuario | null>(null)
  const [usuarioInput, setUsuarioInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [errorLogin, setErrorLogin] = useState('')

  const [sedes, setSedes] = useState<string[]>([])
  const [sedeVisible, setSedeVisible] = useState('')
  const [modulo, setModulo] = useState<Modulo>('panel')

  const [mesas, setMesas] = useState<Mesa[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [cargando, setCargando] = useState(false)
  const [errorDatos, setErrorDatos] = useState('')

  const [nuevoPedido, setNuevoPedido] = useState({
    cliente: '',
    items: '',
    total: '',
    metodoPago: 'Efectivo' as 'Efectivo' | 'Tarjeta',
    mesaId: '' as string | number,
  })

  const fetchModuloData = useCallback(async (sede: string) => {
    setCargando(true)
    setErrorDatos('')
    try {
      const [mesasRes, pedidosRes, invRes] = await Promise.all([
        fetch(`${API}/mesas?sede=${encodeURIComponent(sede)}`),
        fetch(`${API}/pedidos?sede=${encodeURIComponent(sede)}`),
        fetch(`${API}/inventario?sede=${encodeURIComponent(sede)}`),
      ])
      if (!mesasRes.ok || !pedidosRes.ok || !invRes.ok) throw new Error('fetch')
      const m = (await mesasRes.json()) as Mesa[]
      const pRaw = (await pedidosRes.json()) as Record<string, unknown>[]
      const p: Pedido[] = pRaw.map((row) => ({
        id: Number(row.id),
        sede: String(row.sede),
        mesa: String(row.mesa),
        cliente: String(row.cliente ?? ''),
        items: String(row.items ?? ''),
        total: Number(row.total),
        estado: String(row.estado),
        metodoPago: String(row.metodoPago ?? ''),
      }))
      const inv = (await invRes.json()) as InventarioItem[]
      setMesas(m)
      setPedidos(p)
      setInventario(inv)
    } catch {
      setErrorDatos('Sin conexión al backend o PostgreSQL. Revisa Docker y puerto 8080.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!sesion || !sedeVisible) return
    void fetchModuloData(sedeVisible)
  }, [sesion, sedeVisible, fetchModuloData])

  useEffect(() => {
    if (!sesion) return
    void (async () => {
      try {
        const r = await fetch(`${API}/sedes`)
        if (r.ok) setSedes(await r.json())
      } catch {
        /* ignore */
      }
    })()
  }, [sesion])

  const iniciarSesion = async () => {
    setErrorLogin('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuarioInput.trim(), password: passwordInput }),
      })
      if (!res.ok) {
        setErrorLogin('Credenciales incorrectas o API no disponible')
        return
      }
      const user = (await res.json()) as Usuario
      setSesion(user)
      setSedeVisible(user.sede)
      setModulo('panel')
      await fetchModuloData(user.sede)
    } catch {
      setErrorLogin('No se pudo conectar al backend (puerto 8080).')
    }
  }

  const cerrarSesion = () => {
    setSesion(null)
    setUsuarioInput('')
    setPasswordInput('')
    setModulo('panel')
  }

  const toggleMesa = async (id: number) => {
    const res = await fetch(`${API}/mesas/${id}/toggle`, { method: 'PATCH' })
    if (res.ok && sedeVisible) await fetchModuloData(sedeVisible)
  }

  const crearPedido = async () => {
    if (!sesion || !sedeVisible) return
    const totalNum = Number(nuevoPedido.total.replace(',', '.')) || 0
    const mesaId =
      nuevoPedido.mesaId === '' || nuevoPedido.mesaId === 'none' ? null : Number(nuevoPedido.mesaId)
    const res = await fetch(`${API}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sede: sedeVisible,
        mesaId,
        cliente: nuevoPedido.cliente,
        items: nuevoPedido.items,
        total: totalNum,
        metodoPago: nuevoPedido.metodoPago,
      }),
    })
    if (res.ok) {
      setNuevoPedido({ cliente: '', items: '', total: '', metodoPago: 'Efectivo', mesaId: '' })
      await fetchModuloData(sedeVisible)
    }
  }

  const cerrarPedido = async (id: number) => {
    const res = await fetch(`${API}/pedidos/${id}/cerrar`, { method: 'POST' })
    if (res.ok && sedeVisible) await fetchModuloData(sedeVisible)
  }

  const navDisponible = sesion ? modulosPorRol(sesion.rol) : []

  const totalesPedidos = useMemo(() => pedidos.map((p) => p.total), [pedidos])
  const ordenadosQuick = useMemo(() => quickSortRecursive([...totalesPedidos]), [totalesPedidos])
  const inventarioOrdenado = useMemo(() => insertionSortCantidad([...inventario]), [inventario])
  const sumaTotales = useMemo(() => sumaRecursiva(totalesPedidos), [totalesPedidos])

  const exportarCSV = () => {
    const rows = [
      ['id', 'cliente', 'items', 'total', 'estado', 'metodoPago'],
      ...pedidos.map((p) => [
        String(p.id),
        p.cliente,
        p.items.replace(/\n/g, ' '),
        String(p.total),
        p.estado,
        p.metodoPago,
      ]),
    ]
    const blob = new Blob([rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pedidos-${sedeVisible}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!sesion) {
    return (
      <main className={`login-page ${temaOscuro ? 'theme-dark' : 'theme-light'}`}>
        <button type="button" className="theme-toggle fixed" onClick={() => setTemaOscuro((v) => !v)}>
          {temaOscuro ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <section className="login-card">
          <p className="brand">COPA DORADA</p>
          <h1>Iniciar sesión</h1>
          <p className="hint">Pragma Dev Studio</p>
          <p className="hint">admin@gmail.com / admin1234</p>
          <p className="hint">mesero@copadorada.com / mesero1234</p>
          <p className="hint">cajero@copadorada.com / cajero1234</p>
          <label>
            Correo
            <input value={usuarioInput} onChange={(e) => setUsuarioInput(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Contraseña
            <div className="password-wrap">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label="Mostrar u ocultar contraseña"
              >
                <span className={`mascot-eye ${mostrarPassword ? 'show' : 'hide'}`} />
              </button>
            </div>
          </label>
          {errorLogin ? <p className="error">{errorLogin}</p> : null}
          <button type="button" onClick={() => void iniciarSesion()}>
            Entrar
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className={`erp-shell ${temaOscuro ? 'theme-dark' : 'theme-light'}`}>
      <header className="erp-top">
        <div className="erp-brand">
          <strong>COPA DORADA</strong>
          <span className="erp-user">
            {sesion.nombre} · {sesion.rol} · sede: {sesion.sede}
          </span>
        </div>
        <div className="sede-row">
          <label>
            Sede
            <select value={sedeVisible} onChange={(e) => setSedeVisible(e.target.value)}>
              {(sedes.length ? sedes : [sesion.sede]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="theme-toggle fixed" style={{ position: 'static' }} onClick={() => setTemaOscuro((v) => !v)}>
            {temaOscuro ? 'Claro' : 'Oscuro'}
          </button>
          <button type="button" className="pill" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      <nav className="erp-nav" aria-label="Módulos">
        {navDisponible.map((m) => (
          <button key={m} type="button" className={modulo === m ? 'active' : ''} onClick={() => setModulo(m)}>
            {m === 'panel' && 'Panel'}
            {m === 'mesas' && 'Mesas'}
            {m === 'pedidos' && 'Pedidos'}
            {m === 'inventario' && 'Inventario'}
            {m === 'analisis' && 'Algoritmos'}
          </button>
        ))}
      </nav>

      <main className="erp-main">
        {errorDatos ? <p className="error">{errorDatos}</p> : null}
        {cargando ? <p className="muted">Cargando…</p> : null}

        {modulo === 'panel' && (
          <div className="grid-cards">
            <div className="card">
              <h3>Resumen</h3>
              <p className="muted">{sedeVisible}</p>
              <p>
                Mesas: {mesas.length} · Abiertos: {pedidos.filter((p) => p.estado === 'Abierto').length}
              </p>
            </div>
            <div className="card">
              <h3>Inventario</h3>
              <p>{inventario.length} ítems</p>
            </div>
          </div>
        )}

        {modulo === 'mesas' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Cupo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {mesas.map((m) => (
                  <tr key={m.id}>
                    <td>{m.numero}</td>
                    <td>{m.cupo}</td>
                    <td>{m.ocupada ? 'Ocupada' : 'Libre'}</td>
                    <td>
                      <button type="button" className="pill" onClick={() => void toggleMesa(m.id)}>
                        Alternar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modulo === 'pedidos' && (
          <>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Nuevo pedido</h3>
              <div className="form-grid">
                <label>
                  Cliente
                  <input value={nuevoPedido.cliente} onChange={(e) => setNuevoPedido((s) => ({ ...s, cliente: e.target.value }))} />
                </label>
                <label>
                  Mesa
                  <select value={nuevoPedido.mesaId} onChange={(e) => setNuevoPedido((s) => ({ ...s, mesaId: e.target.value }))}>
                    <option value="">—</option>
                    {mesas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.numero}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ítems
                  <textarea value={nuevoPedido.items} onChange={(e) => setNuevoPedido((s) => ({ ...s, items: e.target.value }))} />
                </label>
                <label>
                  Total
                  <input value={nuevoPedido.total} onChange={(e) => setNuevoPedido((s) => ({ ...s, total: e.target.value }))} />
                </label>
                <label>
                  Pago
                  <select
                    value={nuevoPedido.metodoPago}
                    onChange={(e) =>
                      setNuevoPedido((s) => ({ ...s, metodoPago: e.target.value as 'Efectivo' | 'Tarjeta' }))
                    }
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </label>
                <div className="form-actions">
                  <button type="button" onClick={() => void crearPedido()}>
                    Registrar
                  </button>
                  <button type="button" className="pill" onClick={exportarCSV}>
                    CSV
                  </button>
                </div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mesa</th>
                    <th>Cliente</th>
                    <th>Ítems</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.mesa}</td>
                      <td>{p.cliente}</td>
                      <td>{p.items}</td>
                      <td>{p.total.toLocaleString('es-CO')}</td>
                      <td>
                        <span className="badge">{p.estado}</span>
                      </td>
                      <td>
                        {p.estado === 'Abierto' ? (
                          <button type="button" className="pill pill-ok" onClick={() => void cerrarPedido(p.id)}>
                            Cerrar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {modulo === 'inventario' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map((i) => (
                  <tr key={i.id}>
                    <td>{i.producto}</td>
                    <td>{i.cantidad}</td>
                    <td>{i.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modulo === 'analisis' && sesion.rol === 'Administrador' && (
          <div className="grid-cards">
            <div className="card">
              <h3>QuickSort (recursivo)</h3>
              <div className="algo-box">{JSON.stringify(ordenadosQuick)}</div>
            </div>
            <div className="card">
              <h3>Inserción (iterativo)</h3>
              <div className="algo-box">{inventarioOrdenado.map((i) => `${i.producto}: ${i.cantidad}`).join(' · ')}</div>
            </div>
            <div className="card">
              <h3>Suma recursiva</h3>
              <p>{sumaTotales.toLocaleString('es-CO')}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
