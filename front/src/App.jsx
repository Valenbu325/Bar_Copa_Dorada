import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Plus, 
  X, 
  TrendingUp, 
  DollarSign, 
  BarChart3 
} from 'lucide-react';

// --- COMPONENTE: ÍTEM DE LA BARRA LATERAL ---
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
      active 
        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-900/20' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold">{label}</span>
  </div>
);

function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    codigo: '', 
    nombre: '', 
    categoria: 'Drinks', 
    costo_compra: '', 
    precio_venta: ''
  });

  // --- LÓGICA DE DATOS (CONEXIÓN CON DJANGO) ---
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/productos/');
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/productos/', newProduct);
      setShowModal(false);
      setNewProduct({ codigo: '', nombre: '', categoria: 'Drinks', costo_compra: '', precio_venta: '' });
      fetchProducts(); // Recargar la lista automáticamente
    } catch (error) {
      alert("Error adding product. Please verify the code is unique.");
    }
  };

  // --- LÓGICA DE CÁLCULOS PARA EL DASHBOARD ---
  const totalCost = products.reduce((acc, p) => acc + parseFloat(p.costo_compra || 0), 0);
  const totalValue = products.reduce((acc, p) => acc + parseFloat(p.precio_venta || 0), 0);
  const potentialProfit = totalValue - totalCost;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black p-6 flex flex-col gap-8 border-r border-gray-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <BarChart3 size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">COPA DORADA</h1>
            <p className="text-[10px] text-yellow-500 font-bold tracking-[0.2em]">BAR SYSTEM</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === 'Inventory'} onClick={() => setActiveTab('Inventory')} />
          <SidebarItem icon={ShoppingCart} label="Orders" active={activeTab === 'Orders'} onClick={() => setActiveTab('Orders')} />
          <SidebarItem icon={Users} label="Staff" active={activeTab === 'Staff'} onClick={() => setActiveTab('Staff')} />
        </nav>

        <div className="border-t border-gray-800 pt-6">
          <SidebarItem icon={LogOut} label="Sign Out" onClick={() => alert('Logging out...')} />
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tight">{activeTab}</h2>
            <p className="text-gray-500 text-sm">Welcome back, Administrator.</p>
          </div>

          {activeTab === 'Inventory' && (
            <button 
              onClick={() => setShowModal(true)} 
              className="flex items-center gap-2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Add Product
            </button>
          )}
        </header>

        {/* ZONA DE CONTENIDO DINÁMICO */}
        <div className="animate-in fade-in duration-500">
          
          {/* VISTA: DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-gray-800 group-hover:text-gray-700 transition-colors">
                  <Package size={120} />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Inventory Cost</p>
                <p className="text-4xl font-black">${totalCost.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <span className="bg-gray-800 px-2 py-1 rounded">Total Invested</span>
                </div>
              </div>

              <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-gray-800 group-hover:text-gray-700 transition-colors">
                  <TrendingUp size={120} />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Potential Revenue</p>
                <p className="text-4xl font-black text-green-500">${totalValue.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-900/50">
                  <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded">Estimated Sales</span>
                </div>
              </div>

              <div className="bg-yellow-500 p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-yellow-600 group-hover:text-yellow-700 transition-colors opacity-30">
                  <DollarSign size={120} />
                </div>
                <p className="text-yellow-900 font-bold text-xs uppercase tracking-widest mb-2">Expected Profit</p>
                <p className="text-4xl font-black text-black">${potentialProfit.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="bg-black/10 text-black font-bold px-2 py-1 rounded italic underline decoration-2">Net Earnings</span>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: INVENTARIO */}
          {activeTab === 'Inventory' && (
            <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50">
                  <tr className="text-gray-400 text-[10px] font-black tracking-[0.2em] uppercase">
                    <th className="py-5 px-6">Code</th>
                    <th className="py-5 px-6">Product Name</th>
                    <th className="py-5 px-6">Category</th>
                    <th className="py-5 px-6 text-right">Sale Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-5 px-6 font-mono text-xs text-yellow-500">{p.codigo}</td>
                      <td className="py-5 px-6 font-bold text-lg">{p.nombre}</td>
                      <td className="py-5 px-6">
                        <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right font-black text-xl text-green-400">
                        ${parseFloat(p.precio_venta).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-20 text-center text-gray-600 italic">No products found in the database.</div>
              )}
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="flex flex-col items-center justify-center p-20 text-gray-600">
              <ShoppingCart size={60} className="mb-4 opacity-20" />
              <p className="text-xl font-bold uppercase italic">Sales Module Coming Soon</p>
            </div>
          )}
        </div>

        {/* MODAL PARA AGREGAR PRODUCTO */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Add New Entry</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddProduct} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Product Identification</label>
                  <input required placeholder="Code (e.g. BEER-01)" className="p-4 bg-black border border-gray-800 rounded-xl focus:border-yellow-500 outline-none transition-all" value={newProduct.codigo} onChange={(e) => setNewProduct({...newProduct, codigo: e.target.value})} />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Display Name</label>
                  <input required placeholder="Product Name" className="p-4 bg-black border border-gray-800 rounded-xl focus:border-yellow-500 outline-none transition-all" value={newProduct.nombre} onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Cost Price</label>
                    <input required type="number" placeholder="0.00" className="p-4 bg-black border border-gray-800 rounded-xl focus:border-yellow-500 outline-none transition-all" value={newProduct.costo_compra} onChange={(e) => setNewProduct({...newProduct, costo_compra: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Sale Price</label>
                    <input required type="number" placeholder="0.00" className="p-4 bg-black border border-gray-800 rounded-xl focus:border-yellow-500 outline-none transition-all" value={newProduct.precio_venta} onChange={(e) => setNewProduct({...newProduct, precio_venta: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="bg-yellow-500 text-black font-black p-4 rounded-xl mt-4 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
                  REGISTER PRODUCT
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;