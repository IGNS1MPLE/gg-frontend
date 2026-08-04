import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Plus, Edit, Trash2, MapPin, Check, X, FileText, RotateCcw } from 'lucide-react';

export default function Hawkers() {
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHawker, setEditingHawker] = useState(null);
  const [selectedHawkerReturnsModal, setSelectedHawkerReturnsModal] = useState(null);
  
  const [newHawker, setNewHawker] = useState({ 
    name: '', 
    contact_info: '', 
    route: '',
    status: true 
  });

  const fetchData = async () => {
    try {
      const [hawkersRes, productsRes, logsRes] = await Promise.all([
        api.get('/hawkers/'),
        api.get('/products/'),
        api.get('/logs/')
      ]);
      setHawkers(hawkersRes);
      setProducts(productsRes);
      setLogs(logsRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hawker profile?")) {
      try {
        await api.delete(`/hawkers/${id}`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Failed to delete hawker.");
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hawkers/', newHawker);
      setShowAddForm(false);
      setNewHawker({ name: '', contact_info: '', route: '', status: true });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to add hawker');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingHawker) return;
    try {
      await api.put(`/hawkers/${editingHawker.id}`, editingHawker);
      setEditingHawker(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update hawker');
    }
  };

  const filteredHawkers = hawkers.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    (h.contact_info && h.contact_info.toLowerCase().includes(search.toLowerCase())) ||
    (h.route && h.route.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter logs for the selected hawker return modal
  const hawkerReturnsList = selectedHawkerReturnsModal 
    ? logs.filter(log => log.hawker_id === selectedHawkerReturnsModal.id)
    : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Hawkers Management</h1>
        <button className="btn" onClick={() => { setShowAddForm(!showAddForm); setEditingHawker(null); }}>
          <Plus size={18} /> Add New Hawker
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Create Hawker Profile</h3>
          <form onSubmit={handleAdd} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Name *</label>
                <input required type="text" value={newHawker.name} onChange={e => setNewHawker({...newHawker, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={newHawker.contact_info} onChange={e => setNewHawker({...newHawker, contact_info: e.target.value})} placeholder="Phone / Location" />
              </div>
              <div className="form-group">
                <label>Route Assignment</label>
                <input type="text" value={newHawker.route} onChange={e => setNewHawker({...newHawker, route: e.target.value})} placeholder="e.g. Route 4 - North Sector" />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="status" checked={newHawker.status} onChange={e => setNewHawker({...newHawker, status: e.target.checked})} style={{ width: 'auto' }} />
              <label htmlFor="status" style={{ margin: 0 }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Profile</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingHawker && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
          <h3>Edit Hawker Profile (#{editingHawker.id})</h3>
          <form onSubmit={handleUpdate} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Name *</label>
                <input required type="text" value={editingHawker.name} onChange={e => setEditingHawker({...editingHawker, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={editingHawker.contact_info || ''} onChange={e => setEditingHawker({...editingHawker, contact_info: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Route Assignment</label>
                <input type="text" value={editingHawker.route || ''} onChange={e => setEditingHawker({...editingHawker, route: e.target.value})} placeholder="e.g. Route 4 - North Sector" />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="edit-status" checked={editingHawker.status} onChange={e => setEditingHawker({...editingHawker, status: e.target.checked})} style={{ width: 'auto' }} />
              <label htmlFor="edit-status" style={{ margin: 0 }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Check size={16}/> Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingHawker(null)}><X size={16}/> Cancel</button>
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
              placeholder="Search hawkers by name, contact, or route..." 
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
                <th>Route Assignment</th>
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
                    {hawker.route ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)' }}>
                        <MapPin size={14} color="var(--accent-color)" /> {hawker.route}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not assigned</span>
                    )}
                  </td>
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
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.6rem', marginRight: '0.5rem', fontSize: '0.8rem' }} 
                      title="View Returns Entries"
                      onClick={() => setSelectedHawkerReturnsModal(hawker)}
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px' }} /> Returns Log
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', marginRight: '0.5rem' }} title="Edit" onClick={() => { setEditingHawker(hawker); setShowAddForm(false); }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDelete(hawker.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHawkers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hawkers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hawker Returns History Table Modal */}
      {selectedHawkerReturnsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '750px', width: '100%', border: '1px solid var(--accent-color)', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedHawkerReturnsModal(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--accent-color)" size={20}/> Returns Entries: {selectedHawkerReturnsModal.name}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Historical log of unsold returns & damaged product entries for this hawker.
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Returned Qty</th>
                    <th>Damaged Qty</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {hawkerReturnsList.map(log => {
                    const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}` };
                    return (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td style={{ color: 'var(--info-color)', fontWeight: 600 }}>{log.returned_qty}</td>
                        <td style={{ color: log.damaged_qty > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: log.damaged_qty > 0 ? 700 : 400 }}>
                          {log.damaged_qty || 0}
                        </td>
                        <td>{log.remarks || '-'}</td>
                      </tr>
                    );
                  })}

                  {hawkerReturnsList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No return entries logged for this hawker yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedHawkerReturnsModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
