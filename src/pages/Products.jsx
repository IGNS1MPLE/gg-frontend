import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Plus, Edit, AlertCircle, Trash2, Calendar, ShieldAlert, Clock, Layers, Box } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const defaultProduct = {
    name: '', category: '', unit: 'Pcs', barcode: '', base_cost: '', selling_price: '', commission_rate: '', current_stock: '', min_stock_alert: '10', expiry_date: ''
  };
  
  const [newProduct, setNewProduct] = useState(defaultProduct);

  const categoryOptions = categories.map(cat => ({
    value: cat.name,
    label: cat.name,
    sublabel: cat.description ? cat.description : null
  }));

  if (categoryOptions.length === 0) {
    categoryOptions.push({ value: 'General', label: 'General (Default)' });
  }

  const unitOptions = unitsList.map(u => ({
    value: u.name,
    label: u.name,
    sublabel: u.description ? u.description : null,
    badge: u.abbreviation ? u.abbreviation : null
  }));

  if (unitOptions.length === 0) {
    unitOptions.push({ value: 'Pcs', label: 'Pcs (Pieces)' });
  }

  const fetchData = async () => {
    try {
      const [prodData, catData, unitData] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
        api.get('/units/').catch(() => [])
      ]);
      setProducts(prodData);
      setCategories(catData);
      if (Array.isArray(unitData)) setUnitsList(unitData);

      if (catData.length > 0 && !newProduct.category) {
        setNewProduct(prev => ({ ...prev, category: catData[0].name }));
      }
      if (unitData.length > 0 && !newProduct.unit) {
        setNewProduct(prev => ({ ...prev, unit: unitData[0].name }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        base_cost: parseFloat(newProduct.base_cost) || 0,
        selling_price: parseFloat(newProduct.selling_price) || 0,
        commission_rate: parseFloat(newProduct.commission_rate) || 0,
        current_stock: parseInt(newProduct.current_stock) || 0,
        min_stock_alert: parseInt(newProduct.min_stock_alert) || 0,
        expiry_date: newProduct.expiry_date || null
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        alert('Product updated successfully!');
      } else {
        await api.post('/products/', payload);
        alert('Product added successfully!');
      }
      setShowAddForm(false);
      setEditingId(null);
      setNewProduct({ ...defaultProduct, category: categories[0]?.name || 'General', unit: unitsList[0]?.name || 'Pcs' });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save product');
    }
  };

  const handleEditClick = (product) => {
    setNewProduct({
      name: product.name,
      category: product.category,
      unit: product.unit || 'Pcs',
      barcode: product.barcode || '',
      base_cost: product.base_cost ?? '',
      selling_price: product.selling_price ?? '',
      commission_rate: product.commission_rate ?? '',
      current_stock: product.current_stock ?? '',
      min_stock_alert: product.min_stock_alert ?? '',
      expiry_date: product.expiry_date || ''
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };


  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Failed to delete product.");
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewProduct({ ...defaultProduct, category: categories[0]?.name || 'General' });
  };

  const filteredProducts = [...products]
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.unit && p.unit.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search))
    )
    .sort((a, b) => {
      if (a.updated_at && b.updated_at) {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      return b.id - a.id;
    });


  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Products Catalog</h1>
        <button className="btn" onClick={() => { 
          setShowAddForm(!showAddForm); 
          setEditingId(null); 
          setNewProduct({ ...defaultProduct, category: categories[0]?.name || 'General' }); 
        }}>
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Product' : 'Create New Product'}</h3>
          <form onSubmit={handleAddOrEdit} className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Row 1: Basics (4 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label>Name *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Product Name" />
              </div>

              <div className="form-group">
                <label>Category (Select Created) *</label>
                <SearchableSelect
                  options={categoryOptions}
                  value={newProduct.category}
                  onChange={(val) => setNewProduct({ ...newProduct, category: val })}
                  placeholder="-- Select Category --"
                  required={true}
                  icon={Layers}
                />
              </div>

              <div className="form-group">
                <label>Product Unit *</label>
                <SearchableSelect
                  options={unitOptions}
                  value={newProduct.unit}
                  onChange={(val) => setNewProduct({ ...newProduct, unit: val })}
                  placeholder="-- Select Unit --"
                  required={true}
                  icon={Box}
                />
              </div>

              <div className="form-group">
                <label>Barcode/QR</label>
                <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="Scan or enter code" />
              </div>
            </div>

            {/* Row 2: Pricing & Commission (3 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label>Base Cost (₹)</label>
                <input required type="number" step="0.01" placeholder="0.00" value={newProduct.base_cost} onChange={e => setNewProduct({...newProduct, base_cost: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input required type="number" step="0.01" placeholder="0.00" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hawker Commission (₹)</label>
                <input required type="number" step="0.01" placeholder="0.00" value={newProduct.commission_rate} onChange={e => setNewProduct({...newProduct, commission_rate: e.target.value})} />
              </div>
            </div>

            {/* Row 3: Stock & Expiry (3 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label>Initial Stock</label>
                <input required type="number" placeholder="0" value={newProduct.current_stock} onChange={e => setNewProduct({...newProduct, current_stock: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Min Stock Alert</label>
                <input required type="number" placeholder="10" value={newProduct.min_stock_alert} onChange={e => setNewProduct({...newProduct, min_stock_alert: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} color="var(--warning-color)"/> Expiry Date (Optional)
                </label>
                <input type="date" value={newProduct.expiry_date} onChange={e => setNewProduct({...newProduct, expiry_date: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-success">{editingId ? 'Update Product' : 'Save Product'}</button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}


      <div className="card">
        <div className="filters-panel">
          <div className="topbar-search" style={{ margin: 0, width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search by product name, category, unit, or code..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Cost/Price</th>
                <th>Comm.</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const hasExpiry = Boolean(product.expiry_date);
                const isExpired = hasExpiry && product.expiry_date <= todayStr;
                const isExpiringSoon = hasExpiry && !isExpired && product.expiry_date <= thirtyDaysLater;

                return (
                  <tr key={product.id}>
                    <td>#{product.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {product.name}
                      {product.barcode && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.barcode}</div>}
                    </td>
                    <td><span className="badge info">{product.category}</span></td>
                    <td><span className="badge warning" style={{ background: '#FEF3C7', color: '#92400E' }}>{product.unit || 'Pcs'}</span></td>
                    <td>₹{product.base_cost.toFixed(2)} / ₹{product.selling_price.toFixed(2)}</td>
                    <td>₹{product.commission_rate.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>{product.current_stock} {product.unit || 'Pcs'}</td>
                    <td>
                      {product.expiry_date ? (
                        <span style={{ fontSize: '0.85rem' }}>{product.expiry_date}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {product.current_stock <= product.min_stock_alert && (
                          <span className="badge danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <AlertCircle size={12} /> Low Stock
                          </span>
                        )}
                        {isExpired && (
                          <span className="badge danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <ShieldAlert size={12} /> Expired
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="badge warning" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <Clock size={12} /> Expiring Soon
                          </span>
                        )}
                        {product.current_stock > product.min_stock_alert && !isExpired && !isExpiringSoon && (
                          <span className="badge success" style={{ width: 'fit-content' }}>In Stock</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', marginRight: '0.5rem' }} title="Edit" onClick={() => handleEditClick(product)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDeleteClick(product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No products found.
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
