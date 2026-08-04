import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Layers, Plus, Edit, Trash2, Search, Tag, Package, Check, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [newCat, setNewCat] = useState({
    name: '',
    description: '',
    color_code: '#3b82f6'
  });

  const fetchData = async () => {
    try {
      const [catData, prodData] = await Promise.all([
        api.get('/categories/'),
        api.get('/products/')
      ]);
      setCategories(catData);
      setProducts(prodData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories/', newCat);
      setShowForm(false);
      setNewCat({ name: '', description: '', color_code: '#3b82f6' });
      fetchData();
      alert('Category created successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to create category');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.put(`/categories/${editingCategory.id}`, editingCategory);
      setEditingCategory(null);
      fetchData();
      alert('Category updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert('Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Organize products into custom categories and track inventory distribution.
          </p>
        </div>
        <button className="btn" onClick={() => { setShowForm(!showForm); setEditingCategory(null); }}>
          <Plus size={18} /> Add New Category
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Create Product Category</h3>
          <form onSubmit={handleCreate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Category Name *</label>
                <input required type="text" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} placeholder="e.g. Snacks & Beverages" />
              </div>
              <div className="form-group">
                <label>Color Code</label>
                <input type="color" value={newCat.color_code} onChange={e => setNewCat({...newCat, color_code: e.target.value})} style={{ height: '42px', cursor: 'pointer' }} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})} placeholder="Category details..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Category</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingCategory && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Edit Category (#{editingCategory.id})</h3>
          <form onSubmit={handleUpdate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Category Name *</label>
                <input required type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Color Code</label>
                <input type="color" value={editingCategory.color_code || '#3b82f6'} onChange={e => setEditingCategory({...editingCategory, color_code: e.target.value})} style={{ height: '42px', cursor: 'pointer' }} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={editingCategory.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Check size={16}/> Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingCategory(null)}><X size={16}/> Cancel</button>
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
              placeholder="Search categories..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Color</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Products Count</th>
                <th>Total Stock Units</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(cat => {
                const catProducts = products.filter(p => (p.category || 'General').toLowerCase() === cat.name.toLowerCase());
                const totalStock = catProducts.reduce((sum, p) => sum + (p.current_stock || 0), 0);

                return (
                  <tr key={cat.id}>
                    <td>
                      <span style={{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', background: cat.color_code || '#3b82f6' }}></span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td>{cat.description || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--info-color)' }}>{catProducts.length} Products</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>{totalStock} Units</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', marginRight: '0.5rem' }} title="Edit" onClick={() => setEditingCategory(cat)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDelete(cat.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No categories found. Click "Add New Category" to create one.
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
