import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'
const THEME_KEY = 'copa-theme'

type Module = 'dashboard' | 'users' | 'inventory' | 'orders' | 'reports'
type RoleCode = 'ADMIN' | 'WAITER' | 'CASHIER'

interface LoginResponse {
  id: number
  nombre: string
  email: string
  rol: RoleCode
  sede: string
}

interface Branch {
  id: number
  code: string
  name: string
}

interface Role {
  id: number
  code: RoleCode
  name: string
}

interface UserRow {
  id: number
  fullName: string
  email: string
  role: string
  branchId: number
  branchName: string
  active: boolean
}

interface Product {
  id: number
  sku: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  active: boolean
}

interface InventoryItem {
  inventoryId: number
  branchId: number
  branchName: string
  productId: number
  productName: string
  category: string
  quantity: number
}

interface Order {
  id: number
  branchId: number
  branchName: string
  waiterId: number
  waiterName: string
  status: 'OPEN' | 'CLOSED'
  totalAmount: number
  createdAt: string
  details?: { productName: string; quantity: number }[]
}

interface BranchSales {
  branchId: number
  branchName: string
  totalSales: number
}

interface ReportData {
  totalSales: number
  salesByBranch: BranchSales[]
  inventoryStatus: InventoryItem[]
}

function roleModules(role: RoleCode): Module[] {
  if (role === 'ADMIN') return ['dashboard', 'users', 'inventory', 'orders', 'reports']
  if (role === 'CASHIER') return ['dashboard', 'inventory', 'orders', 'reports']
  return ['dashboard', 'orders']
}

export default function App() {
  const [themeDark, setThemeDark] = useState<boolean>(() => localStorage.getItem(THEME_KEY) !== 'light')
  const [session, setSession] = useState<LoginResponse | null>(null)
  const [module, setModule] = useState<Module>('dashboard')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingMovement, setSavingMovement] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [closingOrderId, setClosingOrderId] = useState<number | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('')

  const [users, setUsers] = useState<UserRow[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [reports, setReports] = useState<ReportData | null>(null)

  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', roleCode: 'WAITER' as RoleCode, branchId: 0 })
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', categoryId: 1, costPrice: '', salePrice: '' })
  const [movement, setMovement] = useState({ branchId: 0, productId: 0, movementType: 'IN', quantity: '', reason: '' })
  const [newOrder, setNewOrder] = useState({ branchId: 0, waiterId: 0, notes: '', productId: 0, quantity: '1' })
  const [closePayload, setClosePayload] = useState({ cashierId: 0, paymentMethodCode: 'CASH' })

  const availableModules = session ? roleModules(session.rol) : []

  const dashboardKpis = useMemo(() => {
    const totalSales = reports?.totalSales ?? 0
    const totalOrders = orders.length
    const totalProducts = products.length
    const activeOrders = orders.filter((o) => o.status === 'OPEN').length
    return { totalSales, totalOrders, totalProducts, activeOrders }
  }, [orders, products, reports])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeDark ? 'dark' : 'light')
  }, [themeDark])

  const extractError = async (res: Response, fallback: string) => {
    try {
      const data = (await res.json()) as { error?: string }
      return data?.error || fallback
    } catch {
      return fallback
    }
  }

  const fetchLookups = async () => {
    const [branchesRes, rolesRes] = await Promise.all([fetch(`${API}/branches`), fetch(`${API}/roles`)])
    if (branchesRes.ok) {
      const b = (await branchesRes.json()) as Branch[]
      setBranches(b)
      if (session && session.rol !== 'ADMIN') {
        const userBranch = b.find((branch) => branch.name === session.sede)
        if (userBranch) {
          setSelectedBranchId(userBranch.id)
          setNewOrder((prev) => ({ ...prev, branchId: userBranch.id }))
          setMovement((prev) => ({ ...prev, branchId: userBranch.id }))
          setNewUser((prev) => ({ ...prev, branchId: userBranch.id }))
        }
      }
    }
    if (rolesRes.ok) setRoles((await rolesRes.json()) as Role[])
  }

  const loadModuleData = async (forcedBranchId?: number) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const activeBranchId = forcedBranchId ?? Number(selectedBranchId || 0)
      const branchIdParam = activeBranchId ? `?branchId=${activeBranchId}` : ''
      const [usersRes, productsRes, invRes, ordersRes, reportsRes] = await Promise.all([
        fetch(`${API}/users`),
        fetch(`${API}/products?sort=price`),
        fetch(`${API}/inventory${branchIdParam}`),
        fetch(`${API}/orders${branchIdParam}`),
        fetch(`${API}/reports`),
      ])
      if (usersRes.ok) setUsers((await usersRes.json()) as UserRow[])
      if (productsRes.ok) setProducts((await productsRes.json()) as Product[])
      if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
      if (ordersRes.ok) setOrders((await ordersRes.json()) as Order[])
      if (reportsRes.ok) setReports((await reportsRes.json()) as ReportData)
    } catch {
      setError('Could not load system data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    void fetchLookups()
    void loadModuleData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedBranchId])

  const login = async () => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
      setError('Invalid credentials or API unavailable.')
        return
      }
      const user = (await res.json()) as LoginResponse
      setSession(user)
      const branch = branches.find((b) => b.name === user.sede) ?? null
      if (branch) {
        setSelectedBranchId(branch.id)
        setNewOrder((prev) => ({ ...prev, branchId: branch.id }))
        setMovement((prev) => ({ ...prev, branchId: branch.id }))
        setNewUser((prev) => ({ ...prev, branchId: branch.id }))
      }
      setModule('dashboard')
    } catch {
      setError('Could not connect to backend (port 8080).')
    }
  }

  const logout = () => {
    setSession(null)
    setEmail('')
    setPassword('')
    setModule('dashboard')
  }

  const createUser = async () => {
    setError('')
    setSuccess('')
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setError('Complete full name, email and password to create user.')
      return
    }
    setSavingUser(true)
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    if (res.ok) {
      setNewUser({ fullName: '', email: '', password: '', roleCode: 'WAITER', branchId: Number(selectedBranchId || 0) })
      await loadModuleData()
      setSuccess('User created successfully.')
      setSavingUser(false)
      return
    }
    setError(await extractError(res, 'Could not create user.'))
    setSavingUser(false)
  }

  const createProduct = async () => {
    setError('')
    setSuccess('')
    if (!newProduct.sku.trim() || !newProduct.name.trim() || Number(newProduct.salePrice || 0) <= 0) {
      setError('Complete SKU, name and a valid sale price.')
      return
    }
    setSavingProduct(true)
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: newProduct.sku,
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        costPrice: Number(newProduct.costPrice || 0),
        salePrice: Number(newProduct.salePrice || 0),
      }),
    })
    if (res.ok) {
      setNewProduct({ sku: '', name: '', categoryId: 1, costPrice: '', salePrice: '' })
      await loadModuleData()
      setSuccess('Product created successfully.')
      setSavingProduct(false)
      return
    }
    setError(await extractError(res, 'Could not create product.'))
    setSavingProduct(false)
  }

  const createMovement = async () => {
    setError('')
    setSuccess('')
    if (!movement.productId || Number(movement.quantity) <= 0) {
      setError('Select a product and a valid quantity for the movement.')
      return
    }
    setSavingMovement(true)
    const res = await fetch(`${API}/inventory/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId: Number(movement.branchId || selectedBranchId || 0),
        productId: Number(movement.productId),
        movementType: movement.movementType,
        quantity: Number(movement.quantity),
        reason: movement.reason,
        userId: session?.id,
      }),
    })
    if (res.ok) {
      setMovement((prev) => ({ ...prev, quantity: '', reason: '' }))
      await loadModuleData()
      setSuccess('Inventory movement applied successfully.')
      setSavingMovement(false)
      return
    }
    setError(await extractError(res, 'Could not register inventory movement.'))
    setSavingMovement(false)
  }

  const createOrder = async () => {
    setError('')
    setSuccess('')
    const branchId = Number(newOrder.branchId || selectedBranchId || 0)
    const productId = Number(newOrder.productId || 0)
    const quantity = Number(newOrder.quantity || 0)
    if (!branchId || !productId || quantity <= 0) {
      setError('You must select branch, product and valid quantity to save the order.')
      return
    }

    setSavingOrder(true)
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId,
        waiterId: Number(newOrder.waiterId || session?.id || 0),
        notes: newOrder.notes,
        items: [{ productId, quantity }],
      }),
    })
    if (res.ok) {
      setSelectedBranchId(branchId)
      setNewOrder((prev) => ({ ...prev, branchId, notes: '', quantity: '1', productId: 0 }))
      await loadModuleData(branchId)
      setSuccess('Order saved successfully.')
      setSavingOrder(false)
      return
    }
    setError(await extractError(res, 'Could not save order.'))
    setSavingOrder(false)
  }

  const closeOrder = async (orderId: number) => {
    setError('')
    setSuccess('')
    setClosingOrderId(orderId)
    const res = await fetch(`${API}/orders/${orderId}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cashierId: Number(closePayload.cashierId || session?.id || 0),
        paymentMethodCode: closePayload.paymentMethodCode,
      }),
    })
    if (res.ok) {
      await loadModuleData()
      setSuccess(`Order #${orderId} closed successfully.`)
      setClosingOrderId(null)
      return
    }
    setError(await extractError(res, 'Could not close order.'))
    setClosingOrderId(null)
  }

  if (!session) {
    return (
      <main className={`login-page ${themeDark ? 'theme-dark' : 'theme-light'}`}>
        <button type="button" className="theme-toggle fixed" onClick={() => setThemeDark((v) => !v)}>
          {themeDark ? 'Light mode' : 'Dark mode'}
        </button>
        <section className="login-card">
          <p className="brand">COPA DORADA</p>
          <h1>Sign in</h1>
          <p className="hint">Pragma Dev Studio ERP</p>
          <p className="hint">Use your registered credentials.</p>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <div className="password-wrap">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword((v) => !v)}>
                <span className={`mascot-eye ${showPassword ? 'show' : 'hide'}`} />
              </button>
            </div>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="button" onClick={() => void login()}>
            Login
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className={`erp-shell ${themeDark ? 'theme-dark' : 'theme-light'}`}>
      <aside className="erp-sidebar">
        <div className="erp-logo">
          <strong>COPA DORADA</strong>
          <span>Smart Bar ERP</span>
        </div>
        <nav className="erp-nav">
          {availableModules.map((m) => (
            <button key={m} type="button" className={module === m ? 'active' : ''} onClick={() => setModule(m)}>
              {m === 'dashboard' && 'Dashboard'}
              {m === 'users' && 'Users'}
              {m === 'inventory' && 'Inventory'}
              {m === 'orders' && 'Orders'}
              {m === 'reports' && 'Reports'}
            </button>
          ))}
        </nav>
      </aside>

      <section className="erp-workspace">
        <header className="erp-top">
          <div className="erp-brand">
            <strong>Pragma Dev Studio - Copa Dorada</strong>
            <span className="erp-user">
              {session.nombre} · {session.rol}
            </span>
          </div>
          <div className="sede-row">
            <label>
              Branch
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                disabled={session.rol !== 'ADMIN'}
              >
                {session.rol === 'ADMIN' && <option value={0}>All branches</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="pill" onClick={() => setThemeDark((v) => !v)}>
              {themeDark ? 'Light' : 'Dark'}
            </button>
            <button type="button" className="pill" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="erp-main">
          {loading ? <p className="muted">Loading...</p> : null}
          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success">{success}</p> : null}

          {module === 'dashboard' && (
            <div className="grid-cards">
              <div className="card">
                <h3>Total Sales</h3>
                <p className="kpi">$ {dashboardKpis.totalSales.toLocaleString('es-CO')}</p>
              </div>
              <div className="card">
                <h3>Total Orders</h3>
                <p className="kpi">{dashboardKpis.totalOrders}</p>
              </div>
              <div className="card">
                <h3>Total Products</h3>
                <p className="kpi">{dashboardKpis.totalProducts}</p>
              </div>
              <div className="card">
                <h3>Active Orders</h3>
                <p className="kpi">{dashboardKpis.activeOrders}</p>
              </div>
            </div>
          )}

          {module === 'users' && (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>Create user</h3>
                <div className="form-grid">
                  <input placeholder="Full name" value={newUser.fullName} onChange={(e) => setNewUser((s) => ({ ...s, fullName: e.target.value }))} />
                  <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} />
                  <input placeholder="Password" value={newUser.password} onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))} />
                  <select value={newUser.roleCode} onChange={(e) => setNewUser((s) => ({ ...s, roleCode: e.target.value as RoleCode }))}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.code}
                      </option>
                    ))}
                  </select>
                  <select value={newUser.branchId || selectedBranchId} onChange={(e) => setNewUser((s) => ({ ...s, branchId: Number(e.target.value) }))}>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void createUser()} disabled={savingUser}>
                    {savingUser ? 'Saving...' : 'Save user'}
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.branchName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {module === 'inventory' && (
            <>
              <div className="grid-cards" style={{ marginBottom: '1rem' }}>
                <div className="card">
                  <h3>Create product</h3>
                  <div className="form-grid">
                    <input placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct((s) => ({ ...s, sku: e.target.value }))} />
                    <input placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))} />
                    <input placeholder="Category ID" value={newProduct.categoryId} onChange={(e) => setNewProduct((s) => ({ ...s, categoryId: Number(e.target.value) }))} />
                    <input placeholder="Cost Price" value={newProduct.costPrice} onChange={(e) => setNewProduct((s) => ({ ...s, costPrice: e.target.value }))} />
                    <input placeholder="Sale Price" value={newProduct.salePrice} onChange={(e) => setNewProduct((s) => ({ ...s, salePrice: e.target.value }))} />
                    <button type="button" onClick={() => void createProduct()} disabled={savingProduct}>
                    {savingProduct ? 'Saving...' : 'Save product'}
                    </button>
                  </div>
                </div>
                <div className="card">
                  <h3>Inventory movement</h3>
                  <div className="form-grid">
                    <select value={movement.branchId || selectedBranchId} onChange={(e) => setMovement((s) => ({ ...s, branchId: Number(e.target.value) }))}>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <select value={movement.productId} onChange={(e) => setMovement((s) => ({ ...s, productId: Number(e.target.value) }))}>
                      <option value={0}>Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select value={movement.movementType} onChange={(e) => setMovement((s) => ({ ...s, movementType: e.target.value }))}>
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                    </select>
                    <input placeholder="Quantity" value={movement.quantity} onChange={(e) => setMovement((s) => ({ ...s, quantity: e.target.value }))} />
                    <input placeholder="Reason" value={movement.reason} onChange={(e) => setMovement((s) => ({ ...s, reason: e.target.value }))} />
                    <button type="button" onClick={() => void createMovement()} disabled={savingMovement}>
                      {savingMovement ? 'Applying...' : 'Apply movement'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Branch</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((i) => (
                      <tr key={i.inventoryId}>
                        <td>{i.productName}</td>
                        <td>{i.category}</td>
                        <td>{i.branchName}</td>
                        <td>{i.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {module === 'orders' && (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>Create order</h3>
                <div className="form-grid">
                  <select
                    value={newOrder.branchId || selectedBranchId}
                    onChange={(e) => setNewOrder((s) => ({ ...s, branchId: Number(e.target.value) }))}
                    disabled={session.rol !== 'ADMIN'}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select value={newOrder.productId} onChange={(e) => setNewOrder((s) => ({ ...s, productId: Number(e.target.value) }))}>
                    <option value={0}>Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.salePrice}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder((s) => ({ ...s, quantity: e.target.value }))}
                    onBlur={() => {
                      if (!newOrder.quantity || Number(newOrder.quantity) <= 0) {
                        setNewOrder((s) => ({ ...s, quantity: '1' }))
                      }
                    }}
                  />
                  <input placeholder="Notes" value={newOrder.notes} onChange={(e) => setNewOrder((s) => ({ ...s, notes: e.target.value }))} />
                  <button type="button" onClick={() => void createOrder()} disabled={savingOrder}>
                    {savingOrder ? 'Saving...' : 'Save order'}
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Branch</th>
                      <th>Waiter</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.branchName}</td>
                        <td>{o.waiterName}</td>
                        <td>
                          {o.details?.length
                            ? o.details.map((d) => `${d.productName} x${d.quantity}`).join(', ')
                            : 'No items'}
                        </td>
                        <td>
                          <span className="badge">{o.status}</span>
                        </td>
                        <td>{o.totalAmount.toLocaleString('es-CO')}</td>
                        <td>
                          {o.status === 'OPEN' && session.rol !== 'WAITER' ? (
                            <div className="form-actions">
                              <select
                                value={closePayload.paymentMethodCode}
                                onChange={(e) => setClosePayload((s) => ({ ...s, paymentMethodCode: e.target.value }))}
                              >
                                <option value="CASH">CASH</option>
                                <option value="CREDIT_CARD">CREDIT_CARD</option>
                                <option value="DEBIT_CARD">DEBIT_CARD</option>
                              </select>
                              <button
                                type="button"
                                className="pill pill-ok"
                                disabled={closingOrderId === o.id}
                                onClick={() => {
                                  setClosePayload((s) => ({ ...s, cashierId: session.id }))
                                  void closeOrder(o.id)
                                }}
                              >
                                {closingOrderId === o.id ? 'Closing...' : 'Close'}
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {module === 'reports' && reports && (
            <div className="grid-cards">
              <div className="card">
                <h3>Total Sales</h3>
                <p className="kpi">$ {reports.totalSales.toLocaleString('es-CO')}</p>
              </div>
              <div className="card">
                <h3>Sales by branch ranking</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.salesByBranch.map((row) => (
                        <tr key={row.branchId}>
                          <td>{row.branchName}</td>
                          <td>{row.totalSales.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}
