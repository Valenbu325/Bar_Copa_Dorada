import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, MapPin, 
  ArrowLeft, Coffee, Trash2, Lock, CreditCard, CookingPot, 
  AlertTriangle, TrendingUp, UserPlus, Save, UserCircle, RefreshCcw, CheckCircle2
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
        ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20' 
        : 'text-gray-500 hover:bg-gray-900 hover:text-white bg-transparent'}`}
    >
      <Icon size={20} /> 
      <span className="text-sm uppercase font-black tracking-widest">{label}</span>
    </button>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [cart, setCart] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'waiter', sedeId: '' });

  // --- CARGA DE DATOS ROBUSTA ---
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

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login/`, loginData);
      setUser(res.data);
      setIsLoggedIn(true);
      setActiveTab(res.data.role === 'admin' ? 'Dashboard' : 'Orders');
    } catch (err) { alert("Login failed."); } finally { setLoading(false); }
  };

  const updateStock = async (invId, newStock) => {
    try {
      await axios.patch(`${API_URL}/inventario/${invId}/`, { stock: parseInt(newStock) });
      loadData();
    } catch (e) { alert("Error updating stock"); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/staff/create/`, staffForm);
      alert("Employee Created!");
      setStaffForm({ name: '', email: '', password: '', role: 'waiter', sedeId: '' });
      loadData();
    } catch (e) { alert("Check if email already exists."); }
  };

  const addToCart = (product) => {
    if (user.role === 'cashier') return;
    const targetSedeId = user.role === 'admin' ? selectedMesa.sede : user.sedeId;
    const branchStock = inventory.find(i => Number(i.producto) === Number(product.id) && Number(i.sede) === Number(targetSedeId));
    const inCart = cart.find(c => c.id === product.id)?.qty || 0;
    if (branchStock && inCart >= branchStock.stock) return alert("⚠️ No stock!");
    
    if (inCart > 0) {
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const orderData = {
          mesa: selectedMesa.id,
          mesero: 1, 
          total: cart.reduce((acc, i) => acc + (i.precio_venta * i.qty), 0),
          items: cart.map(i => ({ id: i.id, qty: i.qty }))
      };
      await axios.post(`${API_URL}/pedidos/`, orderData);
      alert("✅ Order Sent!");
      setCart([]); setSelectedMesa(null); loadData();
    } catch (e) { alert("Error"); } finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
        <div className="bg-gray-900 p-10 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
          <h1 className="text-4xl font-black italic uppercase text-white text-center mb-8 tracking-tighter text-yellow-500">Copa Dorada</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" required placeholder="Email" className="bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-yellow-500 transition-all" onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input type="password" required placeholder="Password" className="bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-yellow-500 transition-all" onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button className="bg-yellow-500 text-black font-black py-5 rounded-2xl mt-4 uppercase active:scale-95 transition-transform cursor-pointer border-none w-full">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">
      <aside className="w-64 bg-black p-6 flex flex-col gap-8 border-r border-gray-800">
        <h1 className="text-yellow-500 font-black italic text-2xl tracking-tighter uppercase">Copa Dorada</h1>
        
        <div className="p-4 bg-gray-900/50 rounded-3xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="text-yellow-500" size={32} />
            <div className="overflow-hidden">
              <p className="text-xs font-black uppercase text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase border-t border-gray-800 pt-2 mt-1 truncate">Sede: {user?.sedeNombre}</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={Users} label="Staff" active={activeTab === 'Staff'} onClick={() => setActiveTab('Staff')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={MapPin} label="Branches" active={activeTab === 'Branches'} onClick={() => {setActiveTab('Branches'); setSelectedSede(null);}} hidden={user.role !== 'admin'} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === 'Inventory'} onClick={() => setActiveTab('Inventory')} hidden={user.role !== 'admin'} />
          <SidebarItem icon={ShoppingCart} label="POS / Orders" active={activeTab === 'Orders'} onClick={() => {setActiveTab('Orders'); setSelectedMesa(null);}} />
        </nav>
        
        <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 p-4 text-red-500 font-black text-xs tracking-widest uppercase hover:bg-red-500/10 rounded-2xl transition-all active:scale-95 cursor-pointer border-none bg-transparent">
          <LogOut size={16}/> Sign Out
        </button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">
                {selectedMesa ? `Table ${selectedMesa.numero}` : selectedSede ? selectedSede.nombre : activeTab}
            </h2>
            <button onClick={loadData} className="p-3 bg-gray-900 rounded-full text-yellow-500 shadow-lg hover:bg-gray-800 active:scale-90 transition-all cursor-pointer border-none">
                <RefreshCcw size={20} />
            </button>
        </header>

        {/* 1. DASHBOARD */}
        {activeTab === 'Dashboard' && stats && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-8 rounded-[35px] border border-gray-800 shadow-xl hover:border-yellow-500/30 transition-colors">
                <p className="text-gray-500 font-bold text-xs uppercase mb-2">Today's Revenue</p>
                <p className="text-5xl font-black text-white">${(stats.revenue_today || 0).toLocaleString()}</p>
              </div>
              <div className="bg-yellow-500 p-8 rounded-[35px] text-black shadow-lg shadow-yellow-500/10 transition-transform hover:scale-[1.02]">
                <p className="font-bold text-xs uppercase mb-2">Active Branches</p>
                <p className="text-5xl font-black">{sedes.length}</p>
              </div>
              <div className="bg-gray-900 p-8 rounded-[35px] border border-gray-800">
                <p className="text-gray-500 font-bold text-xs uppercase mb-2">Low Stock Items</p>
                <p className="text-5xl font-black text-red-500">{inventory.filter(i => i.stock <= i.stock_minimo).length}</p>
              </div>
            </div>
            <div className="bg-gray-900/50 p-8 rounded-[40px] border border-gray-800">
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

        {/* 2. STAFF VIEW */}
        {activeTab === 'Staff' && (
          <div className="bg-gray-900 p-10 rounded-[40px] border border-gray-800 max-w-2xl animate-in slide-in-from-top-4">
            <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><UserPlus className="text-yellow-500"/> Add Employee</h3>
            <form onSubmit={handleCreateStaff} className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required />
              <input type="email" placeholder="Email" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required />
              <input type="password" placeholder="Password" className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required />
              <select className="bg-black border border-gray-800 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none cursor-pointer" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                <option value="waiter">Waiter</option><option value="cashier">Cashier</option><option value="admin">Admin</option>
              </select>
              <select className="bg-black border border-gray-800 p-4 rounded-2xl text-white col-span-2 focus:border-yellow-500 outline-none cursor-pointer" value={staffForm.sedeId} onChange={e => setStaffForm({...staffForm, sedeId: e.target.value})} required>
                <option value="">Select Branch Assignment</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button className="col-span-2 bg-yellow-500 text-black font-black py-5 rounded-2xl mt-4 hover:bg-yellow-400 active:scale-95 transition-all cursor-pointer uppercase border-none">Create User</button>
            </form>
          </div>
        )}

        {/* 3. BRANCHES GRID (SEMÁFORO ROJO/VERDE) */}
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

        {/* 4. STOCK EDITABLE POR SEDE */}
        {activeTab === 'Branches' && selectedSede && (
          <div className="bg-gray-900 rounded-[40px] border border-gray-800 overflow-hidden animate-in fade-in">
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

        {/* 5. INVENTORY GLOBAL VIEW */}
        {activeTab === 'Inventory' && (
          <div className="bg-gray-900 rounded-[40px] border border-gray-800 overflow-hidden shadow-2xl animate-in fade-in">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <tr><th className="p-6">Product</th><th className="p-6">Branch</th><th className="p-6">Stock</th><th className="p-6 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inventory.length > 0 ? inventory.map(i => (
                  <tr key={i.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-bold uppercase">{i.producto_nombre}</td>
                    <td className="p-6 text-xs text-gray-500 font-bold uppercase">{sedes.find(s => s.id === i.sede)?.nombre || 'System'}</td>
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

        {/* 6. POS / ORDERS VIEW */}
        {activeTab === 'Orders' && !selectedMesa && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in zoom-in-95">
            {mesas.filter(m => user.role === 'admin' ? true : m.sede === user.sedeId).map(m => (
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
        )}

        {/* 7. TICKET INTERFACE */}
        {activeTab === 'Orders' && selectedMesa && (
          <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-right duration-500">
            <div className={`flex-1 ${user.role === 'cashier' ? 'hidden' : ''}`}>
              <button onClick={() => setSelectedMesa(null)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white font-black uppercase text-xs active:scale-95 transition-all cursor-pointer bg-transparent border-none"><ArrowLeft size={16}/> Return</button>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inventory.filter(i => i.sede === (user.role === 'admin' ? selectedMesa.sede : user.sedeId)).map(item => (
                  <div key={item.id} onClick={() => addToCart(products.find(p => p.id === item.producto))} className={`p-6 bg-gray-900 border border-gray-800 rounded-[30px] transition-all active:scale-95 cursor-pointer ${item.stock > 0 ? 'hover:border-yellow-500 shadow-lg' : 'opacity-25 pointer-events-none'}`}>
                    <h4 className="font-black uppercase italic leading-none mb-2">{item.producto_nombre}</h4>
                    <p className="text-yellow-500 font-black text-2xl">${parseFloat(products.find(p => p.id === item.producto)?.precio_venta || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-3">Stock: {item.stock}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[400px] bg-black p-8 rounded-[50px] border border-gray-800 shadow-2xl h-fit sticky top-8">
              <h3 className="text-2xl font-black uppercase italic mb-8 border-b border-gray-800 pb-5 flex items-center gap-3"><ShoppingCart className="text-yellow-500" /> Account</h3>
              <div className="flex flex-col gap-4 min-h-[150px]">
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-gray-900/40 p-5 rounded-3xl border border-gray-800/50 transition-all hover:bg-gray-900">
                    <div><p className="text-xs font-black uppercase text-white truncate">{i.nombre}</p><p className="text-[10px] text-gray-500 font-bold">Qty: {i.qty}</p></div>
                    <div className="flex items-center gap-4"><span className="text-yellow-500 font-black text-sm">${(i.precio_venta * i.qty).toLocaleString()}</span><button onClick={() => setCart(cart.filter(c => c.id !== i.id))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl active:scale-75 transition-all cursor-pointer border-none bg-transparent"><Trash2 size={16}/></button></div>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-gray-800">
                <div className="flex justify-between items-end mb-8"><span className="text-gray-500 font-black uppercase text-[10px]">Total Amount</span><span className="text-4xl font-black text-white leading-none">${cart.reduce((acc, i) => acc + (i.precio_venta * i.qty), 0).toLocaleString()}</span></div>
                {user.role === 'cashier' ? (
                  <button onClick={() => alert("Payment Processed!")} className="w-full bg-green-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-400 active:scale-95 transition-all cursor-pointer uppercase border-none">COLLECT</button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={cart.length === 0 || loading} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-20 cursor-pointer uppercase border-none tracking-widest">SEND ORDER</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;