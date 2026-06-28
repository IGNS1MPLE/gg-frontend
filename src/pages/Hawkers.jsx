import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Plus, Edit, UserX, UserCheck } from 'lucide-react';

export default function Hawkers() {
  const [hawkers, setHawkers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHawker, setNewHawker] = useState({ name: '', contact_info: '', status: true });

  const fetchHawkers = async () => {
    try {
      const data = await api.get('/hawkers/');
      setHawkers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHawkers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hawkers/', newHawker);
      setShowAddForm(false);
      setNewHawker({ name: '', contact_info: '', status: true });
      fetchHawkers();
    } catch (e) {
      console.error(e);
      alert('Failed to add hawker');
    }
  };

  const filteredHawkers = hawkers.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    (h.contact_info && h.contact_info.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Hawkers Management</h1>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} /> Add New Hawker
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Create Hawker Profile</h3>
          <form onSubmit={handleAdd} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" value={newHawker.name} onChange={e => setNewHawker({...newHawker, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={newHawker.contact_info} onChange={e => setNewHawker({...newHawker, contact_info: e.target.value})} placeholder="Phone / Location" />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="status" checked={newHawker.status} onChange={e => setNewHawker({...newHawker, status: e.target.checked})} style={{ width: 'auto' }} />
              <label htmlFor="status" style={{ margin: 0 }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Profile</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
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
              placeholder="Search hawkers by name or contact..." 
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
                <th>Contact Info</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHawkers.map(hawker => (
                <tr key={hawker.id}>
                  <td>#{hawker.id}</td>
                  <td style={{ fontWeight: 600 }}>{hawker.name}</td>
                  <td>{hawker.contact_info || '-'}</td>
                  <td>
                    {hawker.status ? (
                      <span className="badge success">Active</span>
                    ) : (
                      <span className="badge danger">Inactive</span>
                    )}
                  </td>
                  <td className={hawker.balance < 0 ? 'text-danger' : (hawker.balance > 0 ? 'text-success' : '')}>
                    ₹{hawker.balance.toFixed(2)}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', marginRight: '0.5rem' }} title="Edit">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHawkers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hawkers found.
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
