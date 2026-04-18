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

interface Category {
  id: number
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

interface Table {
  id: number
  branchId: number
  branchName: string
  number: string
}

interface Order {
  id: number
  branchId: number
  branchName: string
  waiterId: number
  waiterName: string
  tableNumber: string | null
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
  return ['dashboard', 'inventory', 'orders']
}

export default function App() {
  const [themeDark, setThemeDark] = useState<boolean>(() => localStorage.getItem(THEME_KEY) !== 'light')
  const [session, setSession] = useState<LoginResponse | null>(() => {
    try { const s = sessionStorage.getItem('copa-session'); return s ? (JSON.parse(s) as LoginResponse) : null } catch { return null }
  })
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
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('')

  const [users, setUsers] = useState<UserRow[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [reports, setReports] = useState<ReportData | null>(null)

  const [invSearch, setInvSearch] = useState('')
  const [invCatFilter, setInvCatFilter] = useState('')
  const [invZoneFilter, setInvZoneFilter] = useState<number | ''>('')
  const [invPage, setInvPage] = useState(1)
  const [tableBranchFilter, setTableBranchFilter] = useState<number | ''>('')
  const [tablePage, setTablePage] = useState(1)

  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', roleCode: 'WAITER' as RoleCode, branchId: 0 })
  const [editingUser, setEditingUser] = useState<{ id: number; fullName: string; roleCode: RoleCode; branchId: number } | null>(null)
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', categoryId: 1, costPrice: '', salePrice: '' })
  const [movement, setMovement] = useState({ branchId: 0, productId: 0, movementType: 'IN', quantity: '', reason: '' })
  const [newOrder, setNewOrder] = useState({ branchId: 0, waiterId: 0, tableId: 0, notes: '', productId: 0, quantity: '1' })
  const [newTable, setNewTable] = useState({ branchId: 0, number: '' })
  const [closePayload, setClosePayload] = useState({ cashierId: 0, paymentMethodCode: 'CASH' })

  const availableModules = session ? roleModules(session.rol) : []

  const dashboardKpis = useMemo(() => {
    const totalSales = reports?.totalSales ?? 0
    const totalOrders = orders.length
    const totalProducts = products.length
    const activeOrders = orders.filter((o) => o.status === 'OPEN').length
    return { totalSales, totalOrders, totalProducts, activeOrders }
  }, [orders, products, reports])

  const INV_PAGE_SIZE = 5

  const filteredInventory = useMemo(() => {
    const s = invSearch.toLowerCase()
    return inventory
      .filter((i) => i.quantity > 0)
      .filter((i) => !s || i.productName.toLowerCase().includes(s))
      .filter((i) => !invCatFilter || i.category === invCatFilter)
      .filter((i) => !invZoneFilter || i.branchId === Number(invZoneFilter))
  }, [inventory, invSearch, invCatFilter, invZoneFilter])

  const invTotalPages = Math.max(1, Math.ceil(filteredInventory.length / INV_PAGE_SIZE))
  const invPaged = filteredInventory.slice((invPage - 1) * INV_PAGE_SIZE, invPage * INV_PAGE_SIZE)
  const invUniqueCategories = useMemo(() => [...new Set(inventory.map((i) => i.category))], [inventory])

  const orderBranchSeq = useMemo(() => {
    const seqMap = new Map<number, number>()
    const result = new Map<number, string>()
    const sorted = [...orders].sort((a, b) => a.id - b.id)
    for (const o of sorted) {
      const seq = (seqMap.get(o.branchId) ?? 0) + 1
      seqMap.set(o.branchId, seq)
      const code = branches.find((b) => b.id === o.branchId)?.code ?? 'ORD'
      result.set(o.id, `${code}-${String(seq).padStart(3, '0')}`)
    }
    return result
  }, [orders, branches])

  type OrderRow =
    | { isGroup: false; order: Order }
    | { isGroup: true; ids: number[]; firstId: number; tableNumber: string; branchId: number; branchName: string; waiterNames: string; totalAmount: number; details: { productName: string; quantity: number }[] }

  const mergedOrderRows = useMemo((): OrderRow[] => {
    const groupMap = new Map<string, Order[]>()
    const individual: Order[] = []
    for (const o of orders) {
      if (o.status === 'OPEN' && o.tableNumber) {
        const key = `${o.branchId}::${o.tableNumber}`
        const arr = groupMap.get(key) ?? []
        arr.push(o)
        groupMap.set(key, arr)
      } else {
        individual.push(o)
      }
    }
    const rows: OrderRow[] = []
    for (const [, grp] of groupMap) {
      const sorted = [...grp].sort((a, b) => a.id - b.id)
      const detailMap = new Map<string, number>()
      for (const d of sorted.flatMap((o) => o.details ?? [])) {
        detailMap.set(d.productName, (detailMap.get(d.productName) ?? 0) + d.quantity)
      }
      rows.push({
        isGroup: true,
        ids: sorted.map((o) => o.id),
        firstId: sorted[0].id,
        tableNumber: sorted[0].tableNumber!,
        branchId: sorted[0].branchId,
        branchName: sorted[0].branchName,
        waiterNames: [...new Set(sorted.map((o) => o.waiterName))].join(', '),
        totalAmount: sorted.reduce((acc, o) => acc + o.totalAmount, 0),
        details: Array.from(detailMap.entries()).map(([productName, quantity]) => ({ productName, quantity })),
      })
    }
    for (const o of individual) rows.push({ isGroup: false, order: o })
    return rows
  }, [orders])

  const occupiedTableIds = useMemo(() => {
    const ids = new Set<number>()
    for (const o of orders) {
      if (o.status === 'OPEN' && o.tableNumber) {
        const t = tables.find((t) => t.branchId === o.branchId && t.number === o.tableNumber)
        if (t) ids.add(t.id)
      }
    }
    return ids
  }, [orders, tables])

  const TABLE_PAGE_SIZE = 5
  const filteredTables = useMemo(() => tables.filter((t) => !tableBranchFilter || t.branchId === Number(tableBranchFilter)), [tables, tableBranchFilter])
  const tableTotalPages = Math.max(1, Math.ceil(filteredTables.length / TABLE_PAGE_SIZE))
  const tablesPaged = filteredTables.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE)

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
    const [branchesRes, rolesRes, catRes] = await Promise.all([
      fetch(`${API}/branches`),
      fetch(`${API}/roles`),
      fetch(`${API}/categories`),
    ])
    if (branchesRes.ok) {
      const b = (await branchesRes.json()) as Branch[]
      setBranches(b)
      if (!selectedBranchId && b[0]) setSelectedBranchId(b[0].id)
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
    if (catRes.ok) setCategories((await catRes.json()) as Category[])
    const tablesRes = await fetch(`${API}/tables`)
    if (tablesRes.ok) setTables((await tablesRes.json()) as Table[])
  }

  const createTable = async () => {
    if (!newTable.number.trim()) { setError('Table number is required.'); return }
    const branchId = Number(newTable.branchId || selectedBranchId || 0)
    if (!branchId) { setError('Select a branch for the table.'); return }
    const res = await fetch(`${API}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId, number: newTable.number.trim() }),
    })
    if (res.ok) {
      setNewTable({ branchId, number: '' })
      const tablesRes = await fetch(`${API}/tables`)
      if (tablesRes.ok) setTables((await tablesRes.json()) as Table[])
      setSuccess('Table created successfully.')
    } else {
      setError(await extractError(res, 'Could not create table.'))
    }
  }

  const deleteTable = async (tableId: number) => {
    if (!window.confirm('Delete this table?')) return
    const res = await fetch(`${API}/tables/${tableId}`, { method: 'DELETE' })
    if (res.ok) {
      const tablesRes = await fetch(`${API}/tables`)
      if (tablesRes.ok) setTables((await tablesRes.json()) as Table[])
    } else {
      setError(await extractError(res, 'Could not delete table.'))
    }
  }

  const exportInventory = () => {
    const header = ['SKU', 'Product', 'Category', 'Branch', 'Stock', 'Cost Price', 'Sale Price']
    const rows = filteredInventory.map((i) => {
      const p = products.find((prod) => prod.id === i.productId)
      return [p?.sku ?? '', i.productName, i.category, i.branchName, i.quantity, p?.costPrice ?? '', p?.salePrice ?? '']
    })
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventario_copa_dorada.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadModuleData = async (forcedBranchId?: number) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const activeBranchId = forcedBranchId ?? Number(selectedBranchId || 0)
      const branchIdParam = activeBranchId ? `?branchId=${activeBranchId}` : ''
      // Admin always loads all inventory; branch tabs handle the display filter
      const invParam = session.rol === 'ADMIN' ? '' : branchIdParam
      const [usersRes, productsRes, invRes, ordersRes, reportsRes] = await Promise.all([
        fetch(`${API}/users`),
        fetch(`${API}/products?sort=price`),
        fetch(`${API}/inventory${invParam}`),
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
      sessionStorage.setItem('copa-session', JSON.stringify(user))
      setSession(user)
      const branch = branches.find((b) => b.name === user.sede) ?? null
      if (branch) {
        setSelectedBranchId(branch.id)
        setNewOrder((prev) => ({ ...prev, branchId: branch.id }))
        setMovement((prev) => ({ ...prev, branchId: branch.id, movementType: user.rol === 'CASHIER' ? 'OUT' : 'IN' }))
        setNewUser((prev) => ({ ...prev, branchId: branch.id }))
      } else if (user.rol === 'CASHIER') {
        setMovement((prev) => ({ ...prev, movementType: 'OUT' }))
      }
      setModule('dashboard')
    } catch {
      setError('Could not connect to backend (port 8080).')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('copa-session')
    setSession(null)
    setEmail('')
    setPassword('')
    setModule('dashboard')
  }

  const toggleUserActive = async (userId: number) => {
    const res = await fetch(`${API}/users/${userId}/active`, { method: 'PATCH' })
    if (res.ok) {
      const r = await fetch(`${API}/users`)
      if (r.ok) setUsers((await r.json()) as UserRow[])
    } else {
      setError('No se pudo cambiar el estado del usuario.')
    }
  }

  const saveUserEdit = async () => {
    if (!editingUser) return
    setError('')
    if (!editingUser.fullName.trim()) { setError('Full name is required.'); return }
    const res = await fetch(`${API}/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: editingUser.fullName, roleCode: editingUser.roleCode, branchId: editingUser.branchId }),
    })
    if (res.ok) {
      setEditingUser(null)
      const r = await fetch(`${API}/users`)
      if (r.ok) setUsers((await r.json()) as UserRow[])
      setSuccess('User updated successfully.')
    } else {
      setError(await extractError(res, 'Could not update user.'))
    }
  }

  const createUser = async () => {
    setError('')
    setSuccess('')
    if (!newUser.fullName.trim()) {
      setError('El nombre completo es obligatorio.')
      return
    }
    if (!newUser.email.trim() || !newUser.email.toLowerCase().endsWith('@copadorada.com')) {
      setError('El correo debe tener el dominio @copadorada.com')
      return
    }
    if (!newUser.password.trim() || newUser.password.trim().length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.')
      return
    }
    if (!/[0-9]/.test(newUser.password)) {
      setError('La contraseña debe contener al menos un número.')
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

  const removeFromInventory = async (inventoryId: number, productName: string, branchName: string) => {
    if (!window.confirm(`Remove "${productName}" from ${branchName}? Stock will be set to 0. The product stays in the system.`)) return
    const res = await fetch(`${API}/inventory/${inventoryId}/reset`, { method: 'PATCH' })
    if (res.ok) {
      const invRes = await fetch(`${API}/inventory`)
      if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
      setSuccess(`"${productName}" removed from ${branchName} inventory.`)
    } else {
      setError(await extractError(res, 'Could not remove product from inventory.'))
    }
  }

  const createProduct = async () => {
    setError('')
    setSuccess('')
    if (!newProduct.sku.trim()) {
      setError('SKU is required.')
      return
    }
    if (!newProduct.name.trim()) {
      setError('Product name is required.')
      return
    }
    if (newProduct.costPrice === '' || isNaN(Number(newProduct.costPrice))) {
      setError('Cost price must be a valid number.')
      return
    }
    if (newProduct.salePrice === '' || isNaN(Number(newProduct.salePrice))) {
      setError('Sale price must be a valid number.')
      return
    }
    if (Number(newProduct.costPrice) < 0 || Number(newProduct.salePrice) <= 0) {
      setError('Prices must be greater than zero.')
      return
    }
    if (Number(newProduct.salePrice) < Number(newProduct.costPrice)) {
      setError('Sale price cannot be less than cost price.')
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
      const [prodRes, invRes] = await Promise.all([
        fetch(`${API}/products?sort=price`),
        fetch(`${API}/inventory`),
      ])
      if (prodRes.ok) setProducts((await prodRes.json()) as Product[])
      if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
      setSuccess('Producto creado y agregado al inventario de todas las sedes.')
      setSavingProduct(false)
      return
    }
    setError(await extractError(res, 'No se pudo crear el producto.'))
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
      const invRes = await fetch(`${API}/inventory`)
      if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
      setSuccess('Movimiento de inventario aplicado correctamente.')
      setSavingMovement(false)
      return
    }
    setError(await extractError(res, 'No se pudo registrar el movimiento de inventario.'))
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
    if (!newOrder.tableId) {
      setError('You must assign a table to the order.')
      return
    }

    setSavingOrder(true)
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId,
        waiterId: Number(newOrder.waiterId || session?.id || 0),
        tableId: Number(newOrder.tableId || 0) || null,
        notes: newOrder.notes,
        items: [{ productId, quantity }],
      }),
    })
    if (res.ok) {
      setNewOrder((prev) => ({ ...prev, notes: '', quantity: '1', productId: 0, tableId: 0 }))
      const [ordRes, invRes] = await Promise.all([
        fetch(`${API}/orders${branchId ? `?branchId=${branchId}` : ''}`),
        fetch(`${API}/inventory${session?.rol !== 'ADMIN' && branchId ? `?branchId=${branchId}` : ''}`),
      ])
      if (ordRes.ok) setOrders((await ordRes.json()) as Order[])
      if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
      setSuccess('Order saved successfully.')
      setSavingOrder(false)
      return
    }
    setError(await extractError(res, 'Could not save order.'))
    setSavingOrder(false)
  }

  const refreshOrdersAndInventory = async () => {
    const branchId = Number(selectedBranchId || 0)
    const [ordRes, invRes] = await Promise.all([
      fetch(`${API}/orders${branchId ? `?branchId=${branchId}` : ''}`),
      fetch(`${API}/inventory${session?.rol !== 'ADMIN' && branchId ? `?branchId=${branchId}` : ''}`),
    ])
    if (ordRes.ok) setOrders((await ordRes.json()) as Order[])
    if (invRes.ok) setInventory((await invRes.json()) as InventoryItem[])
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
    setClosingOrderId(null)
    if (res.ok) {
      await refreshOrdersAndInventory()
      setSuccess('Order closed successfully.')
      return
    }
    setError(await extractError(res, 'Could not close order.'))
  }

  const closeOrderGroup = async (orderIds: number[]) => {
    setError('')
    setSuccess('')
    const cashierId = Number(closePayload.cashierId || session?.id || 0)
    for (const orderId of orderIds) {
      setClosingOrderId(orderId)
      const res = await fetch(`${API}/orders/${orderId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashierId, paymentMethodCode: closePayload.paymentMethodCode }),
      })
      if (!res.ok) {
        setClosingOrderId(null)
        setError(await extractError(res, `Could not close order #${orderId}.`))
        return
      }
    }
    setClosingOrderId(null)
    await refreshOrdersAndInventory()
    setSuccess('Table orders closed successfully.')
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
              {session.rol !== 'WAITER' && (
                <div className="card kpi-card" style={{ borderTop: '3px solid #10b981' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SALES</p>
                  <p className="kpi" style={{ margin: '0.25rem 0 0' }}>$ {dashboardKpis.totalSales.toLocaleString('es-CO')}</p>
                </div>
              )}
              {session.rol !== 'WAITER' && (
                <div className="card kpi-card" style={{ borderTop: '3px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL ORDERS</p>
                  <p className="kpi" style={{ margin: '0.25rem 0 0' }}>{dashboardKpis.totalOrders}</p>
                </div>
              )}
              <div className="card kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL PRODUCTS</p>
                <p className="kpi" style={{ margin: '0.25rem 0 0' }}>{dashboardKpis.totalProducts}</p>
              </div>
              <div className="card kpi-card" style={{ borderTop: '3px solid #8b5cf6' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIVE ORDERS</p>
                <p className="kpi" style={{ margin: '0.25rem 0 0' }}>
                  {dashboardKpis.activeOrders}{' '}
                  <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 'normal' }}>Open</span>
                </p>
              </div>
            </div>
          )}

          {module === 'users' && (
            <>
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Create new user</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Add a user to the system</p>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Full name *
                    <input placeholder="Eg: John Doe" value={newUser.fullName} onChange={(e) => setNewUser((s) => ({ ...s, fullName: e.target.value }))} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Email *
                    <input type="email" placeholder="user@copadorada.com" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Password *
                    <input type="password" placeholder="Min 8 chars + 1 number" value={newUser.password} onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Role *
                    <select value={newUser.roleCode} onChange={(e) => setNewUser((s) => ({ ...s, roleCode: e.target.value as RoleCode }))}>
                      {roles.map((r) => <option key={r.id} value={r.code}>{r.code}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Branch *
                    <select value={newUser.branchId || selectedBranchId} onChange={(e) => setNewUser((s) => ({ ...s, branchId: Number(e.target.value) }))}>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" className="btn-primary full" onClick={() => void createUser()} disabled={savingUser}>
                      {savingUser ? 'Saving...' : 'Save User'}
                    </button>
                  </div>
                </div>
              </div>

              {editingUser && (
                <div className="card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid #a16207' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Edit user</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Modify name, role or branch</p>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      Full name *
                      <input value={editingUser.fullName} onChange={(e) => setEditingUser((s) => s && ({ ...s, fullName: e.target.value }))} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      Role *
                      <select value={editingUser.roleCode} onChange={(e) => setEditingUser((s) => s && ({ ...s, roleCode: e.target.value as RoleCode }))}>
                        {roles.map((r) => <option key={r.id} value={r.code}>{r.code}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      Branch *
                      <select value={editingUser.branchId} onChange={(e) => setEditingUser((s) => s && ({ ...s, branchId: Number(e.target.value) }))}>
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                      <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => void saveUserEdit()}>Save changes</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="card">
                <h3 style={{ margin: '0 0 0.75rem' }}>User list</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>FULL NAME</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>BRANCH</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.fullName}</strong></td>
                          <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{u.email}</td>
                          <td>{u.role}</td>
                          <td>{u.branchName}</td>
                          <td>
                            <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', background: u.active ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.15)', color: u.active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                                onClick={() => setEditingUser({ id: u.id, fullName: u.fullName, roleCode: u.role as RoleCode, branchId: u.branchId })}>
                                Edit
                              </button>
                              <button type="button" className={u.active ? 'btn-danger' : 'btn-primary'} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => void toggleUserActive(u.id)}>
                                {u.active ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {module === 'inventory' && (
            <>
              {/* Movement card — reusable for ADMIN and CASHIER */}
              {(() => {
                const movementCard = (
                  <div className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>Inventory movement</h3>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Register stock entry or exit</p>
                    </div>
                    <div className="form-grid">
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Zone / Location
                        <select value={movement.branchId || selectedBranchId} onChange={(e) => setMovement((s) => ({ ...s, branchId: Number(e.target.value) }))} disabled={session.rol === 'CASHIER'}>
                          <option value={0}>Select branch</option>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Product
                        <select value={movement.productId} onChange={(e) => setMovement((s) => ({ ...s, productId: Number(e.target.value) }))}>
                          <option value={0}>Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Quantity
                        <input type="number" min={1} placeholder="0" value={movement.quantity} onChange={(e) => setMovement((s) => ({ ...s, quantity: e.target.value }))} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Reason
                        <input placeholder="Eg: Purchase from supplier" value={movement.reason} onChange={(e) => setMovement((s) => ({ ...s, reason: e.target.value }))} />
                      </label>
                      <button type="button" className="btn-primary full" onClick={() => void createMovement()} disabled={savingMovement}>
                        {savingMovement ? 'Registering...' : 'Register Movement'}
                      </button>
                    </div>
                  </div>
                )

                if (session.rol === 'ADMIN') return (
                  <div className="inventory-top" style={{ marginBottom: '1.25rem' }}>
                    <div className="card">
                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Create new product</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Add a product to inventory</p>
                      </div>
                      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          SKU *
                          <input placeholder="Eg: CERV-001" value={newProduct.sku} onChange={(e) => setNewProduct((s) => ({ ...s, sku: e.target.value }))} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          Product name *
                          <input placeholder="Eg: Artisanal IPA Beer" value={newProduct.name} onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600, gridColumn: '1 / -1' }}>
                          Category *
                          <select value={newProduct.categoryId} onChange={(e) => setNewProduct((s) => ({ ...s, categoryId: Number(e.target.value) }))}>
                            <option value={0}>Select category</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          Cost price *
                          <input placeholder="0.00" value={newProduct.costPrice} onChange={(e) => setNewProduct((s) => ({ ...s, costPrice: e.target.value }))} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          Sale price *
                          <input placeholder="0.00" value={newProduct.salePrice} onChange={(e) => setNewProduct((s) => ({ ...s, salePrice: e.target.value }))} />
                        </label>
                        <div className="form-actions">
                          <button type="button" className="btn-secondary" onClick={() => setNewProduct({ sku: '', name: '', categoryId: 0, costPrice: '', salePrice: '' })}>Clear</button>
                          <button type="button" className="btn-primary" onClick={() => void createProduct()} disabled={savingProduct}>
                            {savingProduct ? 'Saving...' : 'Save Product'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {movementCard}
                  </div>
                )

                if (session.rol === 'CASHIER') return (
                  <div style={{ marginBottom: '1.25rem' }}>{movementCard}</div>
                )

                return null
              })()}

              {/* Inventory table */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.75rem' }}>Product inventory</h3>
                <div className="table-header">
                  <input
                    placeholder="Search products..."
                    value={invSearch}
                    onChange={(e) => { setInvSearch(e.target.value); setInvPage(1) }}
                  />
                  <select value={invCatFilter} style={{ width: 'auto' }} onChange={(e) => { setInvCatFilter(e.target.value); setInvPage(1) }}>
                    <option value="">All categories</option>
                    {invUniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {session.rol !== 'WAITER' && (
                    <select value={invZoneFilter} style={{ width: 'auto' }} onChange={(e) => { setInvZoneFilter(e.target.value ? Number(e.target.value) : ''); setInvPage(1) }}>
                      <option value="">All zones</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                  {session.rol !== 'WAITER' && <button type="button" className="btn-secondary" onClick={exportInventory}>Export</button>}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>PRODUCT NAME</th>
                        <th>CATEGORY</th>
                        <th>ZONE</th>
                        <th>STOCK</th>
                        {session.rol !== 'WAITER' && <th>COST PRICE</th>}
                        <th>SALE PRICE</th>
                        {session.rol === 'ADMIN' && <th>ACTIONS</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {invPaged.map((i) => {
                        const p = products.find((prod) => prod.id === i.productId)
                        return (
                          <tr key={i.inventoryId}>
                            <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{p?.sku ?? '-'}</td>
                            <td><strong>{i.productName}</strong></td>
                            <td>{i.category}</td>
                            <td>{i.branchName}</td>
                            <td><strong>{i.quantity}</strong></td>
                            {session.rol !== 'WAITER' && <td>${Number(p?.costPrice ?? 0).toFixed(2)}</td>}
                            <td>${Number(p?.salePrice ?? 0).toFixed(2)}</td>
                            <td style={{ display: 'flex', gap: '0.4rem' }}>
                              {session.rol === 'ADMIN' && (
                                <>
                                  <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                                    onClick={() => setMovement((s) => ({ ...s, productId: i.productId, branchId: i.branchId }))}>
                                    Edit
                                  </button>
                                  <button type="button" className="btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                                    onClick={() => void removeFromInventory(i.inventoryId, i.productName, i.branchName)}>
                                    Remove
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {invPaged.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', opacity: 0.45 }}>No results found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                    Showing {filteredInventory.length === 0 ? 0 : (invPage - 1) * INV_PAGE_SIZE + 1}–{Math.min(invPage * INV_PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length} products
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={() => setInvPage((p) => Math.max(1, p - 1))} disabled={invPage === 1}>Previous</button>
                    {Array.from({ length: invTotalPages }, (_, k) => k + 1).map((pg) => (
                      <button key={pg} type="button" className={invPage === pg ? 'active pill' : 'pill'} onClick={() => setInvPage(pg)}>{pg}</button>
                    ))}
                    <button type="button" className="pill" onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))} disabled={invPage === invTotalPages}>Next</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {module === 'orders' && (
            <>
              {/* Table management — ADMIN only */}
              {session.rol === 'ADMIN' && (
                <div className="inventory-top" style={{ marginBottom: '1.25rem' }}>
                  <div className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>Create table</h3>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Add tables per branch</p>
                    </div>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Branch *
                        <select value={newTable.branchId || selectedBranchId} onChange={(e) => setNewTable((s) => ({ ...s, branchId: Number(e.target.value) }))}>
                          <option value={0}>Select branch</option>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        Table number *
                        <input placeholder="Eg: T-06" value={newTable.number} onChange={(e) => setNewTable((s) => ({ ...s, number: e.target.value }))} />
                      </label>
                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setNewTable((s) => ({ ...s, number: '' }))}>Clear</button>
                        <button type="button" className="btn-primary" onClick={() => void createTable()}>Save Table</button>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>Tables by branch</h3>
                      <select style={{ width: 'auto', fontSize: '0.82rem' }} value={tableBranchFilter} onChange={(e) => { setTableBranchFilter(e.target.value === '' ? '' : Number(e.target.value)); setTablePage(1) }}>
                        <option value="">All branches</option>
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>BRANCH</th><th>TABLE</th><th>ACTIONS</th></tr>
                        </thead>
                        <tbody>
                          {tablesPaged.map((t) => (
                            <tr key={t.id}>
                              <td>{t.branchName}</td>
                              <td><strong>{t.number}</strong></td>
                              <td>
                                <button type="button" className="btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => void deleteTable(t.id)}>Delete</button>
                              </td>
                            </tr>
                          ))}
                          {filteredTables.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', opacity: 0.45, padding: '1.5rem' }}>No tables yet</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>
                        {filteredTables.length === 0 ? 0 : (tablePage - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(tablePage * TABLE_PAGE_SIZE, filteredTables.length)} of {filteredTables.length} tables
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button type="button" className="pill" onClick={() => setTablePage((p) => Math.max(1, p - 1))} disabled={tablePage === 1}>Previous</button>
                        {Array.from({ length: tableTotalPages }, (_, k) => k + 1).map((pg) => (
                          <button key={pg} type="button" className={tablePage === pg ? 'active pill' : 'pill'} onClick={() => setTablePage(pg)}>{pg}</button>
                        ))}
                        <button type="button" className="pill" onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))} disabled={tablePage === tableTotalPages}>Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create order */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Create new order</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', opacity: 0.55 }}>Register a table order</p>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Branch *
                    <select value={newOrder.branchId || selectedBranchId} onChange={(e) => setNewOrder((s) => ({ ...s, branchId: Number(e.target.value), tableId: 0 }))} disabled={session.rol !== 'ADMIN'}>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Table *
                    <select value={newOrder.tableId} onChange={(e) => setNewOrder((s) => ({ ...s, tableId: Number(e.target.value) }))}>
                      <option value={0}>Select table</option>
                      {tables
                        .filter((t) => t.branchId === Number(newOrder.branchId || selectedBranchId))
                        .map((t) => {
                          const occupied = occupiedTableIds.has(t.id)
                          return <option key={t.id} value={t.id}>{t.number} — {occupied ? 'Occupied' : 'Available'}</option>
                        })}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Product *
                    <select value={newOrder.productId} onChange={(e) => setNewOrder((s) => ({ ...s, productId: Number(e.target.value) }))}>
                      <option value={0}>Select product</option>
                      {inventory
                        .filter((i) => i.branchId === Number(newOrder.branchId || selectedBranchId) && i.quantity > 0)
                        .map((i) => {
                          const p = products.find((prod) => prod.id === i.productId)
                          if (!p) return null
                          return <option key={p.id} value={p.id}>{p.name} — ${p.salePrice} (stock: {i.quantity})</option>
                        })}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    Quantity *
                    <input type="number" min={1} step={1} value={newOrder.quantity}
                      onChange={(e) => setNewOrder((s) => ({ ...s, quantity: e.target.value }))}
                      onBlur={() => { if (!newOrder.quantity || Number(newOrder.quantity) <= 0) setNewOrder((s) => ({ ...s, quantity: '1' })) }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 600, gridColumn: '1 / -1' }}>
                    Notes
                    <input placeholder="Eg: no ice" value={newOrder.notes} onChange={(e) => setNewOrder((s) => ({ ...s, notes: e.target.value }))} />
                  </label>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setNewOrder((s) => ({ ...s, notes: '', quantity: '1', productId: 0, tableId: 0 }))}>Clear</button>
                    <button type="button" className="btn-primary" onClick={() => void createOrder()} disabled={savingOrder}>
                      {savingOrder ? 'Saving...' : 'Save Order'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order list */}
              <div className="card">
                <h3 style={{ margin: '0 0 0.75rem' }}>Order list</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>BRANCH</th>
                        <th>TABLE</th>
                        <th>WAITER</th>
                        <th>ITEMS</th>
                        <th>STATUS</th>
                        <th>TOTAL</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedOrderRows.map((row) => {
                        if (row.isGroup) {
                          const isClosing = row.ids.includes(closingOrderId ?? -1)
                          return (
                            <tr key={`grp-${row.firstId}`} style={{ background: 'rgba(161,98,7,0.06)' }}>
                              <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{row.ids.length} orders</td>
                              <td>{row.branchName}</td>
                              <td><strong>{row.tableNumber}</strong></td>
                              <td style={{ fontSize: '0.82rem' }}>{row.waiterNames}</td>
                              <td style={{ fontSize: '0.85rem' }}>
                                {row.details.map((d) => `${d.productName} x${d.quantity}`).join(', ')}
                              </td>
                              <td>
                                <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', background: 'rgba(16,185,129,0.18)', color: '#10b981', fontWeight: 600 }}>
                                  OPEN
                                </span>
                              </td>
                              <td><strong>${row.totalAmount.toLocaleString('es-CO')}</strong></td>
                              <td>
                                {session.rol !== 'WAITER' && (
                                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <select style={{ width: 'auto' }} value={closePayload.paymentMethodCode} onChange={(e) => setClosePayload((s) => ({ ...s, paymentMethodCode: e.target.value }))}>
                                      <option value="CASH">Cash</option>
                                      <option value="CREDIT_CARD">Credit card</option>
                                      <option value="DEBIT_CARD">Debit card</option>
                                    </select>
                                    <button type="button" className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                      disabled={isClosing}
                                      onClick={() => void closeOrderGroup(row.ids)}>
                                      {isClosing ? 'Closing...' : 'Close table'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        }
                        const o = row.order
                        return (
                          <tr key={o.id}>
                            <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{orderBranchSeq.get(o.id) ?? `#${o.id}`}</td>
                            <td>{o.branchName}</td>
                            <td><strong>{o.tableNumber ?? '—'}</strong></td>
                            <td>{o.waiterName}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {o.details?.length ? o.details.map((d) => `${d.productName} x${d.quantity}`).join(', ') : 'No items'}
                            </td>
                            <td>
                              <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', background: o.status === 'OPEN' ? 'rgba(16,185,129,0.18)' : 'rgba(107,114,128,0.2)', color: o.status === 'OPEN' ? '#10b981' : 'inherit', fontWeight: 600 }}>
                                {o.status}
                              </span>
                            </td>
                            <td><strong>${o.totalAmount.toLocaleString('es-CO')}</strong></td>
                            <td>
                              {o.status === 'OPEN' && session.rol !== 'WAITER' ? (
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <select style={{ width: 'auto' }} value={closePayload.paymentMethodCode} onChange={(e) => setClosePayload((s) => ({ ...s, paymentMethodCode: e.target.value }))}>
                                    <option value="CASH">Cash</option>
                                    <option value="CREDIT_CARD">Credit card</option>
                                    <option value="DEBIT_CARD">Debit card</option>
                                  </select>
                                  <button type="button" className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                    disabled={closingOrderId === o.id}
                                    onClick={() => void closeOrder(o.id)}>
                                    {closingOrderId === o.id ? 'Closing...' : 'Close'}
                                  </button>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {module === 'reports' && reports && (() => {
            const branchRows = session.rol === 'ADMIN'
              ? reports.salesByBranch
              : reports.salesByBranch.filter((b) => b.branchName === session.sede)
            const displayTotal = branchRows.reduce((acc, b) => acc + b.totalSales, 0)
            return (
              <>
                <div className="grid-cards" style={{ marginBottom: '1.25rem' }}>
                  <div className="card kpi-card" style={{ borderTop: '3px solid #10b981' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SALES</p>
                    <p className="kpi" style={{ margin: '0.25rem 0 0' }}>$ {displayTotal.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="card kpi-card" style={{ borderTop: '3px solid #3b82f6' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>BRANCHES</p>
                    <p className="kpi" style={{ margin: '0.25rem 0 0' }}>{branchRows.length}</p>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 0.75rem' }}>Sales by branch</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>BRANCH</th>
                          <th>TOTAL SALES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchRows.map((row) => (
                          <tr key={row.branchId}>
                            <td><strong>{row.branchName}</strong></td>
                            <td>$ {row.totalSales.toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          })()}
        </main>
      </section>
    </div>
  )
}
