import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, CheckCircle, Package, Users } from 'lucide-react';

export default function Operations() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);

  // Forms State
  const [newProduct, setNewProduct] = useState({ name: '', base_cost: '', selling_price: '', commission_rate: '' });
  const [newSeller, setNewSeller] = useState({ name: '', contact_info: '' });
  
  // Dispatch/Return State
  const [dispatchData, setDispatchData] = useState({ seller_id: '', product_id: '', dispatched_qty: '', date: new Date().toISOString().split('T')[0] });
  
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const p = await api.get('/products/');
      setProducts(p);
      const s = await api.get('/sellers/');
      setSellers(s);
      const l = await api.get('/logs/');
      setLogs(l);
    } catch (e) { console.error(e); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await api.post('/products/', {
      name: newProduct.name,
      base_cost: parseFloat(newProduct.base_cost),
      selling_price: parseFloat(newProduct.selling_price),
      commission_rate: parseFloat(newProduct.commission_rate)
    });
    setNewProduct({ name: '', base_cost: '', selling_price: '', commission_rate: '' });
    fetchData();
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    await api.post('/sellers/', newSeller);
    setNewSeller({ name: '', contact_info: '' });
    fetchData();
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    await api.post('/dispatch/', {
      date: dispatchData.date,
      seller_id: parseInt(dispatchData.seller_id),
      product_id: parseInt(dispatchData.product_id),
      dispatched_qty: parseInt(dispatchData.dispatched_qty)
    });
    setDispatchData({ ...dispatchData, dispatched_qty: '' });
    fetchData();
  };


  return (
    <div>
      <h1 className="page-title" style={{marginBottom: '2rem'}}>Daily Operations</h1>
      
      <div className="leaderboard-grid">
        {/* Left Column: Management */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div className="card">
            <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}><Package size={20}/> Add Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <input placeholder="Product Name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group"><input type="number" step="0.01" placeholder="Base Cost" required value={newProduct.base_cost} onChange={e => setNewProduct({...newProduct, base_cost: e.target.value})} /></div>
                <div className="form-group"><input type="number" step="0.01" placeholder="Selling Price" required value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} /></div>
                <div className="form-group"><input type="number" step="0.01" placeholder="Commission" required value={newProduct.commission_rate} onChange={e => setNewProduct({...newProduct, commission_rate: e.target.value})} /></div>
              </div>
              <button className="btn" type="submit"><Plus size={16}/> Create Product</button>
            </form>
          </div>

          <div className="card">
            <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}><Users size={20}/> Add Seller</h2>
            <form onSubmit={handleAddSeller}>
              <div className="form-group">
                <input placeholder="Seller Name" required value={newSeller.name} onChange={e => setNewSeller({...newSeller, name: e.target.value})} />
              </div>
              <div className="form-group">
                <input placeholder="Contact Info (Optional)" value={newSeller.contact_info} onChange={e => setNewSeller({...newSeller, contact_info: e.target.value})} />
              </div>
              <button className="btn" type="submit"><Plus size={16}/> Create Seller</button>
            </form>
          </div>
        </div>

        {/* Right Column: Dispatch & Returns */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div className="card">
            <h2 style={{marginBottom: '1rem'}}>Morning Dispatch</h2>
            <form onSubmit={handleDispatch}>
              <div className="form-group">
                <input type="date" required value={dispatchData.date} onChange={e => setDispatchData({...dispatchData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <select required value={dispatchData.seller_id} onChange={e => setDispatchData({...dispatchData, seller_id: e.target.value})}>
                  <option value="">Select Seller</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <select required value={dispatchData.product_id} onChange={e => setDispatchData({...dispatchData, product_id: e.target.value})}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <input type="number" placeholder="Dispatched Qty" required value={dispatchData.dispatched_qty} onChange={e => setDispatchData({...dispatchData, dispatched_qty: e.target.value})} />
              </div>
              <button className="btn" type="submit"><CheckCircle size={16}/> Log Dispatch</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
