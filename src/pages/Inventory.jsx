import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PackagePlus, Search } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  
  const [newPurchase, setNewPurchase] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    quantity: 0,
    total_cost: 0,
    supplier: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [prodData, purData] = await Promise.all([
        api.get('/products/'),
        api.get('/purchases/')
      ]);
      setProducts(prodData);
      setPurchases(purData);
      if (prodData.length > 0 && !newPurchase.product_id) {
        setNewPurchase(prev => ({ ...prev, product_id: prodData[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases/', newPurchase);
      setShowPurchaseForm(false);
      fetchData(); // refresh list and products stock
    } catch (e) {
      console.error(e);
      alert('Failed to log purchase');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Inventory & Stock Management</h1>
        <button className="btn" onClick={() => setShowPurchaseForm(!showPurchaseForm)}>
          <PackagePlus size={18} /> Add New Stock (Purchase)
        </button>
      </div>

      {showPurchaseForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Log New Purchase / Restock</h3>
          <form onSubmit={handlePurchase} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={newPurchase.date} onChange={e => setNewPurchase({...newPurchase, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Product</label>
                <select required value={newPurchase.product_id} onChange={e => setNewPurchase({...newPurchase, product_id: parseInt(e.target.value)})}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.current_stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity Added</label>
                <input required type="number" min="1" value={newPurchase.quantity} onChange={e => setNewPurchase({...newPurchase, quantity: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Total Cost (₹)</label>
                <input required type="number" step="0.01" value={newPurchase.total_cost} onChange={e => setNewPurchase({...newPurchase, total_cost: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Supplier (Optional)</label>
                <input type="text" value={newPurchase.supplier} onChange={e => setNewPurchase({...newPurchase, supplier: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Notes (e.g. Damaged Goods Returns, Expiry Info)</label>
                <input type="text" value={newPurchase.notes} onChange={e => setNewPurchase({...newPurchase, notes: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Purchase</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPurchaseForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Recent Purchases & Stock Additions</h3>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity Added</th>
                <th>Total Cost</th>
                <th>Supplier</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {purchases.slice().reverse().map(purchase => {
                const product = products.find(p => p.id === purchase.product_id);
                return (
                  <tr key={purchase.id}>
                    <td>{purchase.date}</td>
                    <td style={{ fontWeight: 600 }}>{product ? product.name : `ID: ${purchase.product_id}`}</td>
                    <td className="text-success" style={{ fontWeight: 600 }}>+{purchase.quantity}</td>
                    <td>₹{purchase.total_cost.toFixed(2)}</td>
                    <td>{purchase.supplier || '-'}</td>
                    <td>{purchase.notes || '-'}</td>
                  </tr>
                );
              })}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No purchase history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
