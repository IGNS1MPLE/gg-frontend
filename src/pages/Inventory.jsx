import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PackagePlus, Search, Trash2, Users, AlertTriangle, Calendar, Plus, Edit, Phone, Mail, MapPin, Check, X, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'suppliers' | 'expiry'
  
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [newPurchase, setNewPurchase] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    quantity: 1,
    total_cost: 0,
    supplier: '',
    supplier_id: '',
    expiry_date: '',
    notes: ''
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [prodData, purData, suppData] = await Promise.all([
        api.get('/products/'),
        api.get('/purchases/'),
        api.get('/suppliers/')
      ]);
      setProducts(prodData);
      setPurchases(purData);
      setSuppliers(suppData);

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
      const selectedSupp = suppliers.find(s => s.id === parseInt(newPurchase.supplier_id));
      const payload = {
        ...newPurchase,
        product_id: parseInt(newPurchase.product_id),
        quantity: parseInt(newPurchase.quantity),
        total_cost: parseFloat(newPurchase.total_cost),
        supplier: selectedSupp ? selectedSupp.name : newPurchase.supplier,
        supplier_id: selectedSupp ? selectedSupp.id : null,
        expiry_date: newPurchase.expiry_date || null
      };

      await api.post('/purchases/', payload);
      setShowPurchaseForm(false);
      setNewPurchase({
        date: new Date().toISOString().split('T')[0],
        product_id: products[0]?.id || '',
        quantity: 1,
        total_cost: 0,
        supplier: '',
        supplier_id: '',
        expiry_date: '',
        notes: ''
      });
      fetchData();
      alert('Stock purchase logged successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to log purchase');
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase entry? This will revert added stock.")) {
      try {
        await api.delete(`/purchases/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Failed to delete purchase record.");
      }
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, editingSupplier);
        setEditingSupplier(null);
        alert('Supplier updated successfully!');
      } else {
        await api.post('/suppliers/', newSupplier);
        setShowSupplierForm(false);
        setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
        alert('Supplier added successfully!');
      }
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier profile?")) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Failed to delete supplier.");
      }
    }
  };

  // Expiry calculation helper
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return { status: 'none', label: 'No Expiry', class: 'badge secondary' };
    if (expiryDateStr <= todayStr) return { status: 'expired', label: 'EXPIRED', class: 'badge danger' };
    if (expiryDateStr <= thirtyDaysLater) return { status: 'expiring', label: 'Expiring Soon', class: 'badge warning' };
    return { status: 'fresh', label: 'Fresh Stock', class: 'badge success' };
  };

  // Products with Expiry Info
  const productsWithExpiry = products.filter(p => p.expiry_date);
  const expiredProducts = productsWithExpiry.filter(p => p.expiry_date <= todayStr);
  const expiringSoonProducts = productsWithExpiry.filter(p => p.expiry_date > todayStr && p.expiry_date <= thirtyDaysLater);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stock Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Supplier directory, restocks tracking, and product expiration monitoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'purchases' && (
            <button className="btn" onClick={() => setShowPurchaseForm(!showPurchaseForm)}>
              <PackagePlus size={18} /> Add New Restock
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button className="btn" onClick={() => { setShowSupplierForm(!showSupplierForm); setEditingSupplier(null); }}>
              <Plus size={18} /> Add New Supplier
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          className="btn" 
          onClick={() => setActiveTab('purchases')}
          style={{ 
            background: activeTab === 'purchases' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'purchases' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'purchases' ? '2px solid var(--accent-color)' : 'none',
            borderRadius: '6px 6px 0 0',
            padding: '0.65rem 1.25rem'
          }}
        >
          <PackagePlus size={16} style={{ marginRight: '6px' }} /> Restocks & Purchases
        </button>

        <button 
          className="btn" 
          onClick={() => setActiveTab('suppliers')}
          style={{ 
            background: activeTab === 'suppliers' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'suppliers' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'suppliers' ? '2px solid var(--accent-color)' : 'none',
            borderRadius: '6px 6px 0 0',
            padding: '0.65rem 1.25rem'
          }}
        >
          <Users size={16} style={{ marginRight: '6px' }} /> Supplier Management ({suppliers.length})
        </button>

        <button 
          className="btn" 
          onClick={() => setActiveTab('expiry')}
          style={{ 
            background: activeTab === 'expiry' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'expiry' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'expiry' ? '2px solid var(--accent-color)' : 'none',
            borderRadius: '6px 6px 0 0',
            padding: '0.65rem 1.25rem',
            position: 'relative'
          }}
        >
          <Calendar size={16} style={{ marginRight: '6px' }} /> Expiry Tracking & Alerts
          {(expiredProducts.length > 0 || expiringSoonProducts.length > 0) && (
            <span className="badge danger" style={{ marginLeft: '8px', padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}>
              {expiredProducts.length + expiringSoonProducts.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: RESTOCKS & PURCHASES */}
      {activeTab === 'purchases' && (
        <>
          {showPurchaseForm && (
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
              <h3>Log New Restock / Purchase Batch</h3>
              <form onSubmit={handlePurchase} className="mt-4">
                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Purchase Date *</label>
                    <input required type="date" value={newPurchase.date} onChange={e => setNewPurchase({...newPurchase, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Product *</label>
                    <select required value={newPurchase.product_id} onChange={e => setNewPurchase({...newPurchase, product_id: e.target.value})}>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.current_stock})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity Added *</label>
                    <input required type="number" min="1" value={newPurchase.quantity} onChange={e => setNewPurchase({...newPurchase, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Total Cost (₹) *</label>
                    <input required type="number" step="0.01" value={newPurchase.total_cost} onChange={e => setNewPurchase({...newPurchase, total_cost: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Supplier (Select Registered or Type Custom)</label>
                    <select value={newPurchase.supplier_id} onChange={e => setNewPurchase({...newPurchase, supplier_id: e.target.value, supplier: ''})}>
                      <option value="">-- Select Registered Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.contact_person || 'No Contact'})</option>
                      ))}
                    </select>
                    {!newPurchase.supplier_id && (
                      <input 
                        type="text" 
                        style={{ marginTop: '0.5rem' }} 
                        value={newPurchase.supplier} 
                        onChange={e => setNewPurchase({...newPurchase, supplier: e.target.value})} 
                        placeholder="Or enter custom supplier name..." 
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} color="var(--warning-color)"/> Expiry Date (If Applicable)
                    </label>
                    <input type="date" value={newPurchase.expiry_date} onChange={e => setNewPurchase({...newPurchase, expiry_date: e.target.value})} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Notes / Batch Information</label>
                  <input type="text" value={newPurchase.notes} onChange={e => setNewPurchase({...newPurchase, notes: e.target.value})} placeholder="e.g. Batch #4092 - Cold storage restock" />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-success">Save Purchase & Add Stock</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPurchaseForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Recent Restocks & Purchase History</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty Added</th>
                    <th>Total Cost</th>
                    <th>Supplier</th>
                    <th>Expiry Date</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice().reverse().map(purchase => {
                    const product = products.find(p => p.id === purchase.product_id);
                    const expiryInfo = getExpiryStatus(purchase.expiry_date);

                    return (
                      <tr key={purchase.id}>
                        <td>{purchase.date}</td>
                        <td style={{ fontWeight: 600 }}>{product ? product.name : `Product #${purchase.product_id}`}</td>
                        <td className="text-success" style={{ fontWeight: 600 }}>+{purchase.quantity}</td>
                        <td>₹{purchase.total_cost.toFixed(2)}</td>
                        <td>
                          {purchase.supplier ? (
                            <span style={{ fontWeight: 500 }}>{purchase.supplier}</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                          )}
                        </td>
                        <td>
                          {purchase.expiry_date ? (
                            <span className={expiryInfo.class}>{purchase.expiry_date} ({expiryInfo.label})</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                          )}
                        </td>
                        <td>{purchase.notes || '-'}</td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDeletePurchase(purchase.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No restock or purchase history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: SUPPLIER MANAGEMENT */}
      {activeTab === 'suppliers' && (
        <>
          {showSupplierForm && (
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
              <h3>Add New Supplier</h3>
              <form onSubmit={handleSaveSupplier} className="mt-4">
                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Company / Supplier Name *</label>
                    <input required type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Apex Wholesalers Ltd." />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input type="text" value={newSupplier.contact_person} onChange={e => setNewSupplier({...newSupplier, contact_person: e.target.value})} placeholder="e.g. Robert Fox" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="+91 9876543210" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="supplier@example.com" />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Address / City</label>
                    <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="City / Industrial Zone" />
                  </div>
                  <div className="form-group">
                    <label>Notes / Terms</label>
                    <input type="text" value={newSupplier.notes} onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})} placeholder="Payment terms or contract notes" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-success">Save Supplier Profile</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {editingSupplier && (
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
              <h3>Edit Supplier Profile (#{editingSupplier.id})</h3>
              <form onSubmit={handleSaveSupplier} className="mt-4">
                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Company / Supplier Name *</label>
                    <input required type="text" value={editingSupplier.name} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input type="text" value={editingSupplier.contact_person || ''} onChange={e => setEditingSupplier({...editingSupplier, contact_person: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={editingSupplier.phone || ''} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={editingSupplier.email || ''} onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})} />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Address</label>
                    <input type="text" value={editingSupplier.address || ''} onChange={e => setEditingSupplier({...editingSupplier, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input type="text" value={editingSupplier.notes || ''} onChange={e => setEditingSupplier({...editingSupplier, notes: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-success"><Check size={16}/> Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingSupplier(null)}><X size={16}/> Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h3>Registered Suppliers Directory</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Supplier Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Total Restocks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supp => {
                    const suppPurchases = purchases.filter(p => p.supplier_id === supp.id || p.supplier === supp.name);

                    return (
                      <tr key={supp.id}>
                        <td>#{supp.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supp.name}</td>
                        <td>{supp.contact_person || '-'}</td>
                        <td>
                          {supp.phone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} color="var(--accent-color)" /> {supp.phone}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {supp.email ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} color="var(--info-color)" /> {supp.email}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{supp.address || '-'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--info-color)' }}>{suppPurchases.length} Batches</td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem', marginRight: '0.5rem' }} title="Edit" onClick={() => setEditingSupplier(supp)}>
                            <Edit size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDeleteSupplier(supp.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No suppliers registered yet. Click "Add New Supplier" to create your directory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: EXPIRY TRACKING & ALERTS */}
      {activeTab === 'expiry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary KPI Banners */}
          <div className="grid-cols-2" style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ShieldAlert size={40} color="var(--danger-color)" />
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger-color)' }}>{expiredProducts.length}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expired Products / Batches</div>
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Clock size={40} color="var(--warning-color)" />
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning-color)' }}>{expiringSoonProducts.length}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expiring Soon (Within 30 Days)</div>
              </div>
            </div>
          </div>

          {/* Expiration Table */}
          <div className="card">
            <h3>Product & Batch Expiration Monitoring</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Action Recommended</th>
                  </tr>
                </thead>
                <tbody>
                  {productsWithExpiry.map(prod => {
                    const expiryInfo = getExpiryStatus(prod.expiry_date);

                    return (
                      <tr key={prod.id} style={{ background: expiryInfo.status === 'expired' ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                        <td style={{ fontWeight: 600 }}>{prod.name}</td>
                        <td><span className="badge info">{prod.category || 'General'}</span></td>
                        <td style={{ fontWeight: 600 }}>{prod.current_stock} units</td>
                        <td style={{ fontWeight: 600 }}>{prod.expiry_date}</td>
                        <td>
                          <span className={expiryInfo.class}>{expiryInfo.label}</span>
                        </td>
                        <td>
                          {expiryInfo.status === 'expired' && (
                            <span style={{ color: 'var(--danger-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                              ⚠️ Write-off & remove from sellable stock
                            </span>
                          )}
                          {expiryInfo.status === 'expiring' && (
                            <span style={{ color: 'var(--warning-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                              ⚡ Prioritize distribution & clear stock
                            </span>
                          )}
                          {expiryInfo.status === 'fresh' && (
                            <span style={{ color: 'var(--success-color)', fontSize: '0.85rem' }}>
                              ✓ Good condition
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {productsWithExpiry.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No product expiry dates recorded yet. Add expiry dates when cataloging products or logging restocks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
