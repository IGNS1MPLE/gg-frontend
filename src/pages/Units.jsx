import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Box, Plus, Edit, Trash2, Search, Check, X, Tag, Package } from 'lucide-react';

export default function Units() {
  const [units, setUnits] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [newUnit, setNewUnit] = useState({
    name: '',
    abbreviation: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      const [unitData, prodData] = await Promise.all([
        api.get('/units/'),
        api.get('/products/')
      ]);
      setUnits(unitData);
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
      await api.post('/units/', newUnit);
      setShowForm(false);
      setNewUnit({ name: '', abbreviation: '', description: '' });
      fetchData();
      alert('Product Unit created successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to create product unit');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUnit) return;
    try {
      await api.put(`/units/${editingUnit.id}`, editingUnit);
      setEditingUnit(null);
      fetchData();
      alert('Product Unit updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update product unit');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product unit?")) {
      try {
        await api.delete(`/units/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert('Failed to delete product unit');
      }
    }
  };

  const filteredUnits = units.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.abbreviation && u.abbreviation.toLowerCase().includes(search.toLowerCase())) ||
    (u.description && u.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Units Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage product measurement units (e.g. Pcs, Box, Kg, Liter, Pack, Bottle).
          </p>
        </div>
        <button className="btn" onClick={() => { setShowForm(!showForm); setEditingUnit(null); }}>
          <Plus size={18} /> Add New Unit
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Create Product Unit</h3>
          <form onSubmit={handleCreate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Unit Name *</label>
                <input required type="text" value={newUnit.name} onChange={e => setNewUnit({...newUnit, name: e.target.value})} placeholder="e.g. Kilogram, Box, Pack" />
              </div>
              <div className="form-group">
                <label>Abbreviation</label>
                <input type="text" value={newUnit.abbreviation} onChange={e => setNewUnit({...newUnit, abbreviation: e.target.value})} placeholder="e.g. kg, box, pk, pcs" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={newUnit.description} onChange={e => setNewUnit({...newUnit, description: e.target.value})} placeholder="Unit description..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Unit</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingUnit && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Edit Product Unit (#{editingUnit.id})</h3>
          <form onSubmit={handleUpdate} className="mt-4">
            <div className="grid-cols-3" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Unit Name *</label>
                <input required type="text" value={editingUnit.name} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Abbreviation</label>
                <input type="text" value={editingUnit.abbreviation || ''} onChange={e => setEditingUnit({...editingUnit, abbreviation: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={editingUnit.description || ''} onChange={e => setEditingUnit({...editingUnit, description: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Check size={16}/> Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUnit(null)}><X size={16}/> Cancel</button>
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
              placeholder="Search product units..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Abbreviation</th>
                <th>Description</th>
                <th>Products Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map(unit => {
                const unitProducts = products.filter(p => (p.unit || 'Pcs').toLowerCase() === unit.name.toLowerCase());

                return (
                  <tr key={unit.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Box size={16} color="var(--accent-color)" />
                        <span>{unit.name}</span>
                      </div>
                    </td>
                    <td><span className="badge info">{unit.abbreviation || unit.name.toLowerCase()}</span></td>
                    <td>{unit.description || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--info-color)' }}>{unitProducts.length} Products</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', marginRight: '0.5rem' }} title="Edit" onClick={() => setEditingUnit(unit)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDelete(unit.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No product units found. Click "Add New Unit" to create one.
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
