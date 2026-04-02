import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, MapPin, 
  ArrowLeft, Coffee, Trash2, Lock, CreditCard, CookingPot, 
  AlertTriangle, TrendingUp, UserPlus, Save, UserCircle, RefreshCcw, CheckCircle2, BadgePlus, Download, Plus, Minus, Moon, Sun
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTE: ITEM DE NAVEGACIÓN ---
const SidebarItem = ({ icon: Icon, label, active, onClick, hidden }) => {
  if (hidden) return null;
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer border-none
      ${active 
        ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20 translate-x-1' 
        : 'text-gray-500 hover:bg-gray-900 hover:text-white bg-transparent hover:translate-x-1'}`}
    >
      <Icon size={20} /> 
      <span className="text-sm uppercase font-black tracking-widest">{label}</span>
    </button>
  );
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cd-theme') || 'dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cart, setCart] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'waiter', sedeId: '' });
  const [branchForm, setBranchForm] = useState({ nombre: '', direccion: '' });
  const [productForm, setProductForm] = useState({ codigo: '', nombre: '', categoria: '', costo_compra: '', precio_venta: '', es_insumo: false });
  const [tableForm, setTableForm] = useState({ numero: '', sede: '', capacidad: 4 });
  const [inventoryForm, setInventoryForm] = useState({ producto: '', sede: '', stock: 0, stock_minimo: 5 });
  const [reportForm, setReportForm] = useState({ fecha_inicio: '', fecha_fin: '', sede_id: '' });

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  useEffect(() => {
    localStorage.setItem('cd-theme', theme);
  }, [theme]);

  // --- CARGA DE DATOS SINCRONIZADA ---
  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const resP = await axios.get(`${API_URL}/productos/`); setProducts(resP.data);
      const resS = await axios.get(`${API_URL}/sedes/`); setSedes(resS.data);
      const resM = await axios.get(`${API_URL}/mesas/`); setMesas(resM.data);
      const resI = await axios.get(`${API_URL}/inventario/`); setInventory(resI.data);

      if (user?.role === 'admin') {
        try {
          const resStats = await axios.get(`${API_URL}/reports/dashboard/`);
          setStats(resStats.data);
        } catch (e) { console.error("Stats failed"); }
      }
    } catch (e) { console.error("Loading failed", e); }
  }, [isLoggedIn, user]);

  const loadTableOrder = useCallback(async (mesaId) => {
    if (!mesaId) return;

    try {
      const res = await axios.get(`${API_URL}/mesas/${mesaId}/pedido-activo/`);
      const hasOrder = Boolean(res.data?.pedido_id);
      setActiveOrder(hasOrder ? res.data : null);
      setSelectedOrderId(hasOrder ? res.data.pedido_id : null);
      if (!hasOrder) {
        setCart([]);
      }
    } catch (e) {
      console.error("Loading table order failed", e);
      setActiveOrder(null);
      setSelectedOrderId(null);
      setCart([]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedMesa) {
      setActiveOrder(null);
      setSelectedOrderId(null);
      setCart([]);
      return;
    }

    setCart([]);
    loadTableOrder(selectedMesa.id);
  }, [selectedMesa, loadTableOrder]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login/`, loginData);
      setUser(res.data);
      setIsLoggedIn(true);
      setActiveTab(res.data.role === 'admin' ? 'Dashboard' : 'Orders');
    } catch (err) { showToast("Invalid credentials.", 'error'); } finally { setLoading(false); }
  };

  const updateStock = async (invId, newStock) => {
    try {
      await axios.patch(`${API_URL}/inventario/${invId}/`, { stock: parseInt(newStock) });
      loadData();
    } catch (e) { showToast("Could not update stock.", 'error'); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (staffForm.password !== staffForm.confirmPassword) {
      showToast("Passwords do not match.", 'error');
      return;
    }

    if (staffForm.password.length < 6) {
      showToast("Password must be at least 6 characters.", 'error');
      return;
    }

    const payload = {
      name: staffForm.name,
      email: staffForm.email,
      password: staffForm.password,
      role: staffForm.role,
      sedeId: staffForm.sedeId,
    };

    try {
      await axios.post(`${API_URL}/staff/create/`, payload);
      showToast("User created successfully.", 'success');
      setStaffForm({ name: '', email: '', password: '', confirmPassword: '', role: 'waiter', sedeId: '' });
      loadData();
    } catch (e) { showToast("Could not create user.", 'error'); }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/sedes/`, branchForm);
      showToast('Branch created.', 'success');
      setBranchForm({ nombre: '', direccion: '' });
      loadData();
    } catch (e) {
      showToast('Could not create branch.', 'error');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/productos/`, {
        ...productForm,
        costo_compra: Number(productForm.costo_compra),
        precio_venta: Number(productForm.precio_venta),
      });
      showToast('Product created.', 'success');
      setProductForm({ codigo: '', nombre: '', categoria: '', costo_compra: '', precio_venta: '', es_insumo: false });
      loadData();
    } catch (e) {
      showToast('Could not create product.', 'error');
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/mesas/`, {
        ...tableForm,
        numero: Number(tableForm.numero),
        sede: Number(tableForm.sede),
        capacidad: Number(tableForm.capacidad),
      });
      showToast('Table created.', 'success');
      setTableForm({ numero: '', sede: '', capacidad: 4 });
      loadData();
    } catch (e) {
      showToast('Could not create table.', 'error');
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/inventario/`, {
        producto: Number(inventoryForm.producto),
        sede: Number(inventoryForm.sede),
        stock: Number(inventoryForm.stock),
        stock_minimo: Number(inventoryForm.stock_minimo),
      });
      showToast('Inventory item created.', 'success');
      setInventoryForm({ producto: '', sede: '', stock: 0, stock_minimo: 5 });
      loadData();
    } catch (e) {
      showToast('Could not create inventory item.', 'error');
    }
  };

  // 🔹 CORRECCIÓN 3: Protección contra producto undefined
  const addToCart = (product) => {
    if (!product) return; // <-- NUEVA LÍNEA
    if (user.role === 'cashier') return;
    const targetSedeId = user.role === 'admin' ? selectedMesa.sede : user.sedeId;
    const branchStock = inventory.find(i => Number(i.producto) === Number(product.id) && Number(i.sede) === Number(targetSedeId));
    const inCart = cart.find(c => c.id === product.id)?.qty || 0;
    if (branchStock && inCart >= branchStock.stock) {
      showToast("No stock available.", 'error');
      return;
    }
    
    if (inCart > 0) {
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const getMaxQtyForProduct = (productId) => {
    const targetSedeId = user.role === 'admin' ? selectedMesa?.sede : user.sedeId;
    const branchStock = inventory.find(i => Number(i.producto) === Number(productId) && Number(i.sede) === Number(targetSedeId));
    return branchStock ? Number(branchStock.stock) : 0;
  };

  const updateCartQty = (productId, delta) => {
    setCart((prevCart) => prevCart
      .map((item) => {
        if (item.id !== productId) return item;
        const maxQty = getMaxQtyForProduct(productId);
        const nextQty = Math.min(maxQty, Math.max(1, item.qty + delta));
        if (delta > 0 && item.qty >= maxQty) {
          showToast("No more stock available for this product.", 'error');
        }
        return { ...item, qty: nextQty };
      })
      .filter((item) => item.qty > 0));
  };

  const setCartQty = (productId, qtyValue) => {
    const parsedQty = Number(qtyValue);
    if (!Number.isFinite(parsedQty)) return;
    setCart((prevCart) => prevCart.map((item) => {
      if (item.id !== productId) return item;
      const maxQty = getMaxQtyForProduct(productId);
      const nextQty = Math.min(maxQty, Math.max(1, parsedQty));
      if (parsedQty > maxQty) {
        showToast("Quantity adjusted to available stock.", 'info');
      }
      return { ...item, qty: nextQty };
    }));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !selectedMesa) return;
    if (!user?.empleadoId) {
      showToast("Could not identify the linked employee.", 'error');
      return;
    }
    try {
      setLoading(true);
      const orderData = {
          mesa: selectedMesa.id,
          mesero: user.empleadoId,
          total: cart.reduce((acc, i) => acc + (i.precio_venta * i.qty), 0),
          items: cart.map(i => ({ id: i.id, qty: i.qty }))
      };
      const res = await axios.post(`${API_URL}/pedidos/`, orderData);
      await loadTableOrder(selectedMesa.id);
      showToast(activeOrder ? "Items added to the order." : "Order sent successfully.", 'success');
      setCart([]);
      setSelectedOrderId(res.data?.pedido_id || selectedOrderId);
      loadData();
    } catch (e) { showToast("Could not place order.", 'error'); } finally { setLoading(false); }
  };

  const handleCollectOrder = async () => {
    const orderId = selectedOrderId || activeOrder?.pedido_id;
    if (!orderId) return;

    try {
      setLoading(true);
      await axios.post(`${API_URL}/pedidos/${orderId}/pay/`, { cajero_id: user.empleadoId });
      showToast("Payment processed successfully.", 'success');
      setCart([]);
      setActiveOrder(null);
      setSelectedOrderId(null);
      setSelectedMesa(null);
      loadData();
    } catch (e) {
      showToast("Could not process payment.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportForm.fecha_inicio || !reportForm.fecha_fin) {
      showToast("Please select start and end dates.", 'error');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('fecha_inicio', reportForm.fecha_inicio);
      params.append('fecha_fin', reportForm.fecha_fin);
      if (reportForm.sede_id) params.append('sede_id', reportForm.sede_id);
      
      const response = await axios.get(`${API_URL}/reports/ventas/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${reportForm.fecha_inicio}_${reportForm.fecha_fin}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast("CSV report downloaded.", 'success');
    } catch (e) {
      showToast("Could not download report.", 'error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="glass-card p-10 rounded-[40px] w-full max-w-md">
          <p className="text-[10px] text-yellow-400 uppercase tracking-[0.35em] font-black text-center mb-3">Bogota Bar System</p>
          <h1 className="display-brand text-6xl uppercase text-white text-center mb-8 tracking-wider">Copa Dorada</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" required placeholder="Email Address" className="bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-yellow-500" onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input type="password" required placeholder="Password" className="bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-yellow-500" onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button className="btn-accent bg-yellow-500 text-black font-black py-5 rounded-2xl mt-4 uppercase active:scale-95 transition-transform cursor-pointer border-none w-full">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : ''} relative flex min-h-screen flex-col lg:flex-row bg-[radial-gradient(circle_at_top_left,#1f2937_0%,#0a0a0a_35%,#050505_100%)] text-gray-100 font-sans overflow-hidden`}>
      <div className="pointer-events-none absolute -top-28 -left-16 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <aside className="glass-card relative z-10 w-full lg:w-64 p-4 lg:p-6 flex flex-col gap-5 lg:gap-8 border-b lg:border-b-0 border-r-0 lg:border-r border-gray-800/70 rounded-none lg:rounded-r-[28px]">
        <h1 className="display-brand text-yellow-400 text-3xl lg:text-4xl tracking-wider uppercase text-center lg:text-left">Copa Dorada</h1>
        
        {/* --- PROFILE CARD --- */}
        <div className="p-4 panel-shell rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="text-yellow-500" size={32} />
            <div className="overflow-hidden">
              <p className="text-xs font-black uppercase text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase border-t border-gray-800 pt-2 mt-1 truncate">Branch: {user?.sedeNombre}</p>
        </div>

        <button
          onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-center gap-2 p-3 panel-shell rounded-2xl cursor-pointer border-none"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[11px] font-black uppercase tracking-wider">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={BadgePlus} label="Load Data" active={activeTab === 'Load Data'} onClick={() => setActiveTab('Load Data')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={Users} label="Staff" active={activeTab === 'Staff'} onClick={() => setActiveTab('Staff')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={MapPin} label="Branches" active={activeTab === 'Branches'} onClick={() => {setActiveTab('Branches'); setSelectedSede(null);}} hidden={user.role !== 'admin'} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === 'Inventory'} onClick={() => setActiveTab('Inventory')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={Download} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} hidden={user.role !== 'admin' && user.role !== 'cashier'} />
          <SidebarItem icon={ShoppingCart} label="POS / Orders" active={activeTab === 'Orders'} onClick={() => {setActiveTab('Orders'); setSelectedMesa(null);}} />
        </nav>
        
        <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center justify-center lg:justify-start gap-3 p-4 text-red-500 font-black text-xs tracking-widest uppercase hover:bg-red-500/10 rounded-2xl transition-all active:scale-95 cursor-pointer border-none bg-transparent">
          <LogOut size={16}/> Sign Out
        </button>
      </aside>

        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter">
                {selectedMesa ? `Table ${selectedMesa.numero}` : selectedSede ? selectedSede.nombre : activeTab}
            </h2>
          <button onClick={loadData} className="p-3 panel-shell rounded-full text-yellow-500 active:scale-90 transition-all cursor-pointer border-none">
                <RefreshCcw size={20} />
            </button>
        </header>

        {/* --- 2A. REPORTS --- */}
        {activeTab === 'Reports' && (user?.role === 'admin' || user?.role === 'cashier') && (
          <div className="space-y-8 animate-in fade-in">
            <div className="panel-shell p-10 rounded-[40px]">
              <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><Download className="text-yellow-500" /> Sales Report</h3>
              <p className="text-gray-400 mb-8 max-w-3xl leading-relaxed">
                Download a sales report in CSV format. Filter by date range and branch for detailed revenue and cost analysis.
              </p>

              <div className="bg-black/40 p-8 rounded-[30px] border border-gray-800 space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black uppercase text-gray-400 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-yellow-500"
                      value={reportForm.fecha_inicio}
                      onChange={e => setReportForm({...reportForm, fecha_inicio: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black uppercase text-gray-400 mb-2">End Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-yellow-500"
                      value={reportForm.fecha_fin}
                      onChange={e => setReportForm({...reportForm, fecha_fin: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black uppercase text-gray-400 mb-2">Branch (Optional)</label>
                  <select 
                    className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-yellow-500"
                    value={reportForm.sede_id}
                    onChange={e => setReportForm({...reportForm, sede_id: e.target.value})}
                  >
                    <option value="">All branches</option>
                    {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handleDownloadReport}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest border-none hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download CSV Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'Dashboard' && stats && (
          <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="panel-shell p-8 rounded-[35px]">
                <p className="text-gray-500 font-bold text-xs uppercase mb-2">Today's Revenue</p>
                <p className="text-5xl font-black text-white">${(stats.revenue_today || 0).toLocaleString()}</p>
              </div>
              <div className="bg-yellow-500 p-8 rounded-[35px] text-black shadow-lg shadow-yellow-500/25 transition-transform hover:scale-[1.02]">
                <p className="font-bold text-xs uppercase mb-2">Active Branches</p>
                <p className="text-5xl font-black">{sedes.length}</p>
              </div>
              <div className="panel-shell p-8 rounded-[35px]">
                <p className="text-gray-500 font-bold text-xs uppercase mb-2">Low Stock Items</p>
                <p className="text-5xl font-black text-red-500">{inventory.filter(i => i.stock <= i.stock_minimo).length}</p>
              </div>
            </div>
            <div className="panel-shell p-8 rounded-[40px]">
              <h3 className="text-white font-black uppercase italic mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-yellow-500"/> Revenue by Branch</h3>
              {stats.branch_performance?.map(branch => (
                <div key={branch.nombre} className="mb-4">
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span>{branch.nombre}</span>
                    <span>${(branch.total_sales || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${(branch.total_sales / (stats.revenue_today || 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 1B. LOAD DATA --- */}
        {activeTab === 'Load Data' && user?.role === 'admin' && (
          <div className="space-y-10 animate-in fade-in">
            <div className="panel-shell p-10 rounded-[40px]">
              <h3 className="text-3xl font-black italic uppercase mb-2 flex items-center gap-3"><BadgePlus className="text-yellow-500" /> 📊 Data Setup</h3>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                📌 <span className="text-yellow-400 font-bold">Recommended order:</span> Branches → Products → Tables → Inventory
              </p>

              {/* --- STEP 1: BRANCHES --- */}
              <div className="mb-10 bg-blue-500/5 p-8 rounded-[30px] border border-blue-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-500 text-black font-black rounded-full w-8 h-8 flex items-center justify-center text-lg">1️⃣</div>
                  <div>
                    <h4 className="text-xl font-black text-blue-400 uppercase">🏢 BRANCH (Bar Location)</h4>
                    <p className="text-[11px] text-gray-400 font-bold">Create: Galerias, Restrepo, Zona T</p>
                  </div>
                </div>
                <form onSubmit={handleCreateBranch} className="bg-black/40 p-6 rounded-[25px] border border-blue-500/20 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-blue-300 mb-2 block">📍 Branch Name</label>
                    <input type="text" placeholder="Ex: Galerias" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500" value={branchForm.nombre} onChange={e => setBranchForm({...branchForm, nombre: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-blue-300 mb-2 block">📮 Address</label>
                    <input type="text" placeholder="Ex: Carrera 5 #123" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500" value={branchForm.direccion} onChange={e => setBranchForm({...branchForm, direccion: e.target.value})} />
                  </div>
                  <button className="w-full bg-blue-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest border-none hover:bg-blue-400 active:scale-95 transition-all">✅ Create Branch</button>
                </form>
              </div>

              {/* --- STEP 2: PRODUCTS --- */}
              <div className="mb-10 bg-green-500/5 p-8 rounded-[30px] border border-green-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-500 text-black font-black rounded-full w-8 h-8 flex items-center justify-center text-lg">2️⃣</div>
                  <div>
                    <h4 className="text-xl font-black text-green-400 uppercase">🍺 PRODUCT (What You Sell)</h4>
                    <p className="text-[11px] text-gray-400 font-bold">Create: Beers, Cocktails, Food with Price and Cost</p>
                  </div>
                </div>
                <form onSubmit={handleCreateProduct} className="bg-black/40 p-6 rounded-[25px] border border-green-500/20 space-y-4">
                  <input type="text" placeholder="Ex: CORONA001" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-green-500" value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} required />
                  <input type="text" placeholder="Ex: Corona Beer" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-green-500" value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} required />
                  <input type="text" placeholder="Ex: Alcoholic Drink" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-green-500" value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-green-300 mb-2 block">💸 Cost (purchase)</label>
                      <input type="number" step="0.01" placeholder="$3.00" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-green-500" value={productForm.costo_compra} onChange={e => setProductForm({...productForm, costo_compra: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-green-300 mb-2 block">💰 Price (selling)</label>
                      <input type="number" step="0.01" placeholder="$8.00" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-green-500" value={productForm.precio_venta} onChange={e => setProductForm({...productForm, precio_venta: e.target.value})} required />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-black uppercase text-gray-300 bg-black/40 p-3 rounded-xl">
                    <input type="checkbox" checked={productForm.es_insumo} onChange={e => setProductForm({...productForm, es_insumo: e.target.checked})} className="cursor-pointer" />
                    ⚙️ Ingredient (recipe)
                  </label>
                  <button className="w-full bg-green-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest border-none hover:bg-green-400 active:scale-95 transition-all">✅ Create Product</button>
                </form>
              </div>

              {/* --- STEP 3: TABLES --- */}
              <div className="mb-10 bg-purple-500/5 p-8 rounded-[30px] border border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-500 text-black font-black rounded-full w-8 h-8 flex items-center justify-center text-lg">3️⃣</div>
                  <div>
                    <h4 className="text-xl font-black text-purple-400 uppercase">🪑 TABLE (Customer Seating)</h4>
                    <p className="text-[11px] text-gray-400 font-bold">Create: Table 1, 2, 3... (Requires a Branch)</p>
                  </div>
                </div>
                <form onSubmit={handleCreateTable} className="bg-black/40 p-6 rounded-[25px] border border-purple-500/20 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-300 mb-2 block">🔢 Table Number</label>
                    <input type="number" placeholder="Ex: 1" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-purple-500" value={tableForm.numero} onChange={e => setTableForm({...tableForm, numero: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-300 mb-2 block">📍 Assign Branch (Required)</label>
                    <select className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-purple-500 cursor-pointer" value={tableForm.sede} onChange={e => setTableForm({...tableForm, sede: e.target.value})} required>
                      <option value="">⬅️ Select branch first</option>
                      {sedes.map(s => <option key={s.id} value={s.id}>📍 {s.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-300 mb-2 block">👥 Capacity (people)</label>
                    <input type="number" placeholder="4" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-purple-500" value={tableForm.capacidad} onChange={e => setTableForm({...tableForm, capacidad: e.target.value})} required />
                  </div>
                  <button className="w-full bg-purple-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest border-none hover:bg-purple-400 active:scale-95 transition-all">✅ Create Table</button>
                </form>
              </div>

              {/* --- STEP 4: INVENTORY --- */}
              <div className="bg-orange-500/5 p-8 rounded-[30px] border border-orange-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-500 text-black font-black rounded-full w-8 h-8 flex items-center justify-center text-lg">4️⃣</div>
                  <div>
                    <h4 className="text-xl font-black text-orange-400 uppercase">📦 INVENTORY (Initial Stock)</h4>
                    <p className="text-[11px] text-gray-400 font-bold">Set stock quantity for each branch</p>
                  </div>
                </div>
                <form onSubmit={handleCreateInventory} className="bg-black/40 p-6 rounded-[25px] border border-orange-500/20 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-orange-300 mb-2 block">🍺 Select Product</label>
                    <select className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 cursor-pointer" value={inventoryForm.producto} onChange={e => setInventoryForm({...inventoryForm, producto: e.target.value})} required>
                      <option value="">⬅️ Select product first</option>
                      {products.map(p => <option key={p.id} value={p.id}>🍺 {p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-orange-300 mb-2 block">📍 Select Branch</label>
                    <select className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 cursor-pointer" value={inventoryForm.sede} onChange={e => setInventoryForm({...inventoryForm, sede: e.target.value})} required>
                      <option value="">⬅️ Select branch first</option>
                      {sedes.map(s => <option key={s.id} value={s.id}>📍 {s.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-orange-300 mb-2 block">📊 Current Stock</label>
                      <input type="number" placeholder="300" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500" value={inventoryForm.stock} onChange={e => setInventoryForm({...inventoryForm, stock: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-orange-300 mb-2 block">🚨 Minimum Alert</label>
                      <input type="number" placeholder="10" className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500" value={inventoryForm.stock_minimo} onChange={e => setInventoryForm({...inventoryForm, stock_minimo: e.target.value})} required />
                    </div>
                  </div>
                  <button className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest border-none hover:bg-orange-400 active:scale-95 transition-all">✅ Create Inventory</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. STAFF VIEW --- */}
        {activeTab === 'Staff' && (
          <div className="panel-shell p-10 rounded-[40px] max-w-3xl animate-in slide-in-from-top-4 shadow-2xl shadow-black/30">
            <h3 className="text-2xl font-black italic uppercase mb-2 flex items-center gap-3"><UserPlus className="text-yellow-500"/> Create User with Role</h3>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-8">Admins can create waiters, cashiers, and other admins.</p>
            <form onSubmit={handleCreateStaff} className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Full name" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required />
              <input type="email" placeholder="Email" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required />
              <input type="password" placeholder="Password" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required />
              <input type="password" placeholder="Confirm password" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500" value={staffForm.confirmPassword} onChange={e => setStaffForm({...staffForm, confirmPassword: e.target.value})} required />
              <select className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500 cursor-pointer" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                <option value="waiter">Waiter</option><option value="cashier">Cashier</option><option value="admin">Administrator</option>
              </select>
              <select className="bg-black border border-gray-800 p-4 rounded-2xl text-white col-span-2 focus:border-yellow-500 cursor-pointer" value={staffForm.sedeId} onChange={e => setStaffForm({...staffForm, sedeId: e.target.value})} required>
                <option value="">Select assigned branch</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button className="col-span-2 bg-yellow-500 text-black font-black py-5 rounded-2xl mt-4 hover:bg-yellow-400 active:scale-95 transition-all cursor-pointer border-none">Create user</button>
            </form>
          </div>
        )}

        {/* --- 3. BRANCHES GRID (SEMÁFORO ROJO/VERDE) --- */}
        {activeTab === 'Branches' && !selectedSede && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            {sedes.map(s => {
              const branchInventory = inventory.filter(i => Number(i.sede) === Number(s.id));
              const hasAlert = branchInventory.some(i => i.stock <= i.stock_minimo);
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSede(s)} 
                  className={`bg-gray-900 p-10 rounded-[40px] border-2 transition-all active:scale-95 cursor-pointer text-center group relative overflow-hidden
                  ${hasAlert ? 'border-red-900/50 hover:border-red-500 shadow-lg shadow-red-900/10' : 'border-gray-800 hover:border-green-500 shadow-black'}`}
                >
                  <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${hasAlert ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                  <MapPin size={40} className={`mx-auto mb-4 group-hover:scale-110 transition-transform ${hasAlert ? 'text-red-500' : 'text-yellow-500'}`} />
                  <h3 className="text-2xl font-black uppercase italic text-white">{s.nombre}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">{hasAlert ? 'Stock Warnings' : 'All Clear'}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 4. STOCK EDITABLE POR SEDE --- */}
        {activeTab === 'Branches' && selectedSede && (
          <div className="panel-shell rounded-[40px] overflow-hidden animate-in fade-in">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center">
              <button onClick={() => setSelectedSede(null)} className="bg-transparent border-none text-gray-400 hover:text-white flex items-center gap-2 font-black uppercase text-xs active:scale-90 cursor-pointer transition-transform"><ArrowLeft size={16}/> Back</button>
              <h3 className="text-xl font-black uppercase italic">{selectedSede.nombre} Stock</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <tr><th className="p-6">Product</th><th className="p-6">Qty</th><th className="p-6 text-right">Update</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inventory.filter(i => Number(i.sede) === Number(selectedSede.id)).map(i => (
                  <tr key={i.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-bold uppercase">{i.producto_nombre}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${i.stock <= i.stock_minimo ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        {i.stock} Units
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <input type="number" defaultValue={i.stock} className="bg-black border border-gray-800 w-24 p-2 rounded-xl text-center font-black text-white outline-none focus:border-yellow-500" onBlur={(e) => updateStock(i.id, e.target.value)} />
                        <Save size={18} className="text-yellow-500 cursor-pointer hover:scale-125 transition-transform" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 5. INVENTORY GLOBAL VIEW --- */}
        {activeTab === 'Inventory' && (
          <div className="panel-shell rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <tr><th className="p-6">Product</th><th className="p-6">Branch</th><th className="p-6">Stock</th><th className="p-6 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inventory.length > 0 ? inventory.map(i => (
                  <tr key={i.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-bold uppercase">{i.producto_nombre}</td>
                      <td className="p-6 text-xs text-gray-500 font-bold uppercase">{sedes.find(s => Number(s.id) === Number(i.sede))?.nombre || 'System'}</td>
                    <td className="p-6 font-black text-xl">{i.stock}</td>
                    <td className="p-6 text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${i.stock <= i.stock_minimo ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {i.stock <= i.stock_minimo ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-20 text-center text-gray-600 italic">No inventory data found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 6. POS / ORDERS VIEW --- */}
        {activeTab === 'Orders' && !selectedMesa && (
          <div>
            {((mesas || []).filter(m => user?.role === 'admin' ? true : Number(m.sede) === Number(user?.sedeId))).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in zoom-in-95">
                {(mesas || [])
                  .filter(m => user?.role === 'admin' ? true : Number(m.sede) === Number(user?.sedeId))
                  .map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => setSelectedMesa(m)} 
                      className={`aspect-square border-2 rounded-[45px] flex flex-col items-center justify-center gap-4 transition-all active:scale-90 cursor-pointer group shadow-xl 
                      ${!m.activa ? 'bg-red-950/20 border-red-900/50 shadow-red-900/5' : 'bg-gray-900 border-gray-800 hover:border-yellow-500 shadow-black'}`}
                    >
                      <Coffee size={40} className={!m.activa ? 'text-red-500 animate-pulse' : 'text-yellow-500 group-hover:rotate-12 transition-transform'} />
                      <span className="font-black text-xl italic uppercase tracking-tighter">T-{m.numero}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${!m.activa ? 'text-red-500' : 'text-gray-500'}`}>{!m.activa ? 'Occupied' : 'Available'}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="panel-shell rounded-[40px] p-10 max-w-2xl animate-in fade-in">
                <h3 className="text-2xl font-black italic uppercase text-white mb-4">No tables created</h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  The orders view is empty because there are no tables in the database. Create tables in Django admin or in Load Data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- 7. TICKET INTERFACE --- */}
        {activeTab === 'Orders' && selectedMesa && (
          <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-right duration-500">
            <div className={`flex-1 ${user.role === 'cashier' ? 'hidden' : ''}`}>
              <button onClick={() => setSelectedMesa(null)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white font-black uppercase text-xs active:scale-95 transition-all cursor-pointer bg-transparent border-none"><ArrowLeft size={16}/> Return</button>
              {activeOrder?.pedido_id && (
                <div className="mb-6 bg-gray-900 border border-gray-800 rounded-[30px] p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-yellow-500">Open Order #{activeOrder.pedido_id}</h4>
                    <span className="text-sm font-black text-white">${Number(activeOrder.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {(activeOrder.items || []).map(item => (
                      <div key={`${item.id}-${item.nombre}`} className="flex justify-between items-center text-xs bg-black/30 rounded-2xl p-4 border border-gray-800">
                        <div>
                          <p className="font-black uppercase text-white">{item.nombre}</p>
                          <p className="text-gray-500 font-bold uppercase">Qty: {item.qty}</p>
                        </div>
                        <span className="font-black text-yellow-500">${Number(item.precio_venta || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 🔹 CORRECCIÓN 2 + 4: inventory seguro y producto protegido */}
                {(inventory || []).filter(i => Number(i.sede) === Number(user?.role === 'admin' ? selectedMesa?.sede : user?.sedeId)).map(item => {
                  const product = products.find(p => p.id === item.producto);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        if (product) addToCart(product); // <-- NUEVO
                      }} 
                      className={`p-6 bg-gray-900 border border-gray-800 rounded-[30px] transition-all active:scale-95 cursor-pointer ${item.stock > 0 ? 'hover:border-yellow-500 shadow-lg' : 'opacity-25 pointer-events-none grayscale'}`}
                    >
                      <h4 className="font-black uppercase italic leading-none mb-2">{item.producto_nombre}</h4>
                      <p className="text-yellow-500 font-black text-2xl">${parseFloat(product?.precio_venta || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-3">Stock: {item.stock}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-[420px] glass-card p-6 lg:p-8 rounded-[40px] lg:rounded-[50px] shadow-2xl h-fit lg:sticky top-8">
              <h3 className="text-2xl font-black uppercase italic mb-8 border-b border-gray-800 pb-5 flex items-center gap-3"><ShoppingCart className="text-yellow-500" /> Account</h3>
              {activeOrder?.pedido_id && (
                <div className="mb-6 p-5 rounded-[28px] border border-gray-800 bg-gray-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Current Order</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">#{activeOrder.pedido_id}</span>
                  </div>
                  <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                    {(activeOrder.items || []).map(item => (
                      <div key={`${item.id}-${item.nombre}`} className="flex justify-between items-center text-xs bg-black/30 rounded-2xl p-3 border border-gray-800/60">
                        <div>
                          <p className="font-black uppercase text-white">{item.nombre}</p>
                          <p className="text-gray-500 font-bold uppercase">Qty: {item.qty}</p>
                        </div>
                        <span className="font-black text-white">${(Number(item.precio_venta || 0) * Number(item.qty || 0)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-4 min-h-[150px]">
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-gray-900/40 p-5 rounded-3xl border border-gray-800/50 transition-all hover:bg-gray-900">
                    <div>
                      <p className="text-xs font-black uppercase text-white truncate">{i.nombre}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => updateCartQty(i.id, -1)} className="h-7 w-7 rounded-lg bg-gray-800 text-white border-none flex items-center justify-center cursor-pointer hover:bg-gray-700"><Minus size={14} /></button>
                        <input
                          type="number"
                          min="1"
                          value={i.qty}
                          onChange={(e) => setCartQty(i.id, e.target.value)}
                          className="w-14 bg-black border border-gray-700 rounded-lg text-center text-xs font-black text-white p-1"
                        />
                        <button onClick={() => updateCartQty(i.id, 1)} className="h-7 w-7 rounded-lg bg-gray-800 text-white border-none flex items-center justify-center cursor-pointer hover:bg-gray-700"><Plus size={14} /></button>
                        <button onClick={() => updateCartQty(i.id, 5)} className="h-7 px-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black cursor-pointer">+5</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4"><span className="text-yellow-500 font-black text-sm">${(i.precio_venta * i.qty).toLocaleString()}</span><button onClick={() => setCart(cart.filter(c => c.id !== i.id))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl active:scale-75 transition-all cursor-pointer border-none bg-transparent"><Trash2 size={16}/></button></div>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-gray-800">
                <div className="flex justify-between items-end mb-8"><span className="text-gray-500 font-black uppercase text-[10px]">Total Amount</span><span className="text-4xl font-black text-white leading-none">${cart.reduce((acc, i) => acc + (i.precio_venta * i.qty), 0).toLocaleString()}</span></div>
                {user.role === 'cashier' ? (
                  <button onClick={handleCollectOrder} disabled={!selectedOrderId && !activeOrder?.pedido_id} className="w-full bg-green-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-400 active:scale-95 transition-all disabled:opacity-20 cursor-pointer uppercase border-none">COLLECT</button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={cart.length === 0 || loading} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-20 cursor-pointer uppercase border-none tracking-widest">{activeOrder?.pedido_id ? 'ADD ITEMS' : 'SEND ORDER'}</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <p className="text-sm font-bold leading-snug">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;