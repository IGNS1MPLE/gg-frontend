import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Plus, Edit, AlertCircle, Trash2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const defaultProduct = {
    name: '', category: 'General', barcode: '', base_cost: 0, selling_price: 0, commission_rate: 0, current_stock: 0, min_stock_alert: 10
  };
  
  const [newProduct, setNewProduct] = useState(defaultProduct);

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products/');
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, newProduct);
        alert('Product updated successfully!');
      } else {
        await api.post('/products/', newProduct);
        alert('Product added successfully!');
      }
      setShowAddForm(false);
      setEditingId(null);
      setNewProduct(defaultProduct);
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert('Failed to save product');
    }
  };

  const handleEditClick = (product) => {
    setNewProduct({
      name: product.name,
      category: product.category,
      barcode: product.barcode || '',
      base_cost: product.base_cost,
      selling_price: product.selling_price,
      commission_rate: product.commission_rate,
      current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (e) {
        console.error(e);
        alert("Failed to delete product.");
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewProduct(defaultProduct);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Products Catalog</h1>
        <button className="btn" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setNewProduct(defaultProduct); }}>
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Product' : 'Create New Product'}</h3>
          <form onSubmit={handleAddOrEdit} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Product Name" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input required type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="e.g. Snacks, Drinks" />
              </div>
              <div className="form-group">
                <label>Barcode/QR</label>
                <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="Scan or enter code" />
              </div>
              
              <div className="form-group">
                <label>Base Cost (₹)</label>
                <input required type="number" step="0.01" value={newProduct.base_cost} onChange={e => setNewProduct({...newProduct, base_cost: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input required type="number" step="0.01" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Hawker Commission (₹)</label>
                <input required type="number" step="0.01" value={newProduct.commission_rate} onChange={e => setNewProduct({...newProduct, commission_rate: parseFloat(e.target.value)})} />
              </div>

              <div className="form-group">
                <label>Initial Stock</label>
                <input required type="number" value={newProduct.current_stock} onChange={e => setNewProduct({...newProduct, current_stock: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Min Stock Alert</label>
                <input required type="number" value={newProduct.min_stock_alert} onChange={e => setNewProduct({...newProduct, min_stock_alert: parseInt(e.target.value)})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
              placeholder="Search products, categories, barcodes..." 
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
                <th>Cost/Price</th>
                <th>Comm.</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {product.name}
                    {product.barcode && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.barcode}</div>}
                  </td>
                  <td><span className="badge info">{product.category}</span></td>
                  <td>₹{product.base_cost.toFixed(2)} / ₹{product.selling_price.toFixed(2)}</td>
                  <td>₹{product.commission_rate.toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>{product.current_stock}</td>
                  <td>
                    {product.current_stock <= product.min_stock_alert ? (
                      <span className="badge danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <AlertCircle size={14} /> Low Stock
                      </span>
                    ) : (
                      <span className="badge success">In Stock</span>
                    )}
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
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
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
