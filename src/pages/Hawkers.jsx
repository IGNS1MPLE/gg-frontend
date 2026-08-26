import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Search, Plus, Edit, Trash2, MapPin, Check, X, FileText, 
  RotateCcw, ChevronDown, ChevronUp, Package, DollarSign, Calendar, 
  AlertTriangle, ExternalLink, User, CheckCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hawkers() {
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHawker, setEditingHawker] = useState(null);
  const [selectedHawkerReturnsModal, setSelectedHawkerReturnsModal] = useState(null);
  
  // Accordion Expand State
  const [expandedHawkerId, setExpandedHawkerId] = useState(null);

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

  const toggleExpandHawker = (hawkerId) => {
    setExpandedHawkerId(prev => prev === hawkerId ? null : hawkerId);
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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hawkers Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Click on any hawker row to expand and view assigned items, daily sales, and account summaries.
          </p>
        </div>
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
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>ID</th>
                <th>Name (Click to Expand)</th>
                <th>Contact Info</th>
                <th>Route Assignment</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHawkers.map(hawker => {
                const isExpanded = expandedHawkerId === hawker.id;
                
                // Get all logs for this hawker
                const allHawkerLogs = logs.filter(l => l.hawker_id === hawker.id);
                // Today's logs
                const todayHawkerLogs = allHawkerLogs.filter(l => l.date === todayStr);
                
                // Active dispatches (pending returns)
                const pendingLogs = allHawkerLogs.filter(l => l.returned_qty === 0 && l.damaged_qty === 0 && l.cash_collected === 0 && l.sold_qty === 0);

                // Calculations for expanded panel
                const totalIssuedUnits = allHawkerLogs.reduce((sum, l) => sum + l.dispatched_qty, 0);
                const todayIssuedUnits = todayHawkerLogs.reduce((sum, l) => sum + l.dispatched_qty, 0);
                const todayReturnedUnits = todayHawkerLogs.reduce((sum, l) => sum + l.returned_qty, 0);
                const todayDamagedUnits = todayHawkerLogs.reduce((sum, l) => sum + l.damaged_qty, 0);
                const todaySoldUnits = todayHawkerLogs.reduce((sum, l) => sum + l.sold_qty, 0);
                const todayCashCollected = todayHawkerLogs.reduce((sum, l) => sum + l.cash_collected, 0);

                return (
                  <React.Fragment key={hawker.id}>
                    {/* PRIMARY HAWKER ROW */}
                    <tr 
                      onClick={() => toggleExpandHawker(hawker.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? 'rgba(45, 212, 191, 0.08)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {isExpanded ? (
                          <ChevronUp size={18} color="var(--accent-color)" />
                        ) : (
                          <ChevronDown size={18} color="var(--text-secondary)" />
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>#{hawker.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {hawker.name}
                          </span>
                          {todayHawkerLogs.length > 0 && (
                            <span style={{ 
                              fontSize: '0.725rem', 
                              padding: '0.1rem 0.45rem', 
                              borderRadius: '9999px', 
                              background: 'var(--accent-pill)', 
                              color: 'var(--text-primary)',
                              fontWeight: 700 
                            }}>
                              {todayHawkerLogs.length} Issued Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{hawker.contact_info || '-'}</td>
                      <td>
                        {hawker.route ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', fontWeight: 500 }}>
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
                      <td style={{ fontWeight: 800 }} className={hawker.balance < 0 ? 'text-danger' : (hawker.balance > 0 ? 'text-success' : '')}>
                        ₹{hawker.balance.toFixed(2)}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.65rem', marginRight: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }} 
                          title="View Complete Activity Log"
                          onClick={() => setSelectedHawkerReturnsModal(hawker)}
                        >
                          <RotateCcw size={14} style={{ marginRight: '4px' }} /> Full History Log
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', marginRight: '0.5rem' }} title="Edit Profile" onClick={() => { setEditingHawker(hawker); setShowAddForm(false); }}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', color: 'var(--danger-color)' }} title="Delete" onClick={() => handleDelete(hawker.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDABLE ACCORDION DRAWER PANEL */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#F4FAFA' }}>
                        <td colSpan="8" style={{ padding: '1.25rem', borderBottom: '2px solid var(--mint-cyan)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s ease-in-out' }}>
                            
                            {/* DRAWER HEADER BAR */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <User size={18} color="var(--accent-color)" /> Detailed Hawker Summary: <strong>{hawker.name}</strong>
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  Route: <strong>{hawker.route || 'Unassigned'}</strong> | Contact: <strong>{hawker.contact_info || 'N/A'}</strong>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link to="/distribution" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                  <Package size={14} /> Issue Stock
                                </Link>
                                <Link to="/returns" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                  <RotateCcw size={14} /> Process Settlement
                                </Link>
                              </div>
                            </div>

                            {/* KPI STAT CARDS FOR HAWKER */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                              gap: '0.75rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Today's Issued</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--info-color)' }}>{todayIssuedUnits} Units</div>
                              </div>

                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Today's Returned</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{todayReturnedUnits} Units</div>
                              </div>

                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--coral-red)', fontWeight: 600 }}>Today's Damaged</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--coral-red)' }}>{todayDamagedUnits} Units</div>
                              </div>

                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 600 }}>Today's Sold</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)' }}>{todaySoldUnits} Units</div>
                              </div>

                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Today's Cash</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)' }}>₹{todayCashCollected.toFixed(2)}</div>
                              </div>

                              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Account Balance</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: hawker.balance < 0 ? 'var(--coral-red)' : 'var(--success-color)' }}>
                                  ₹{hawker.balance.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* ASSIGNED PRODUCTS ITEMIZATION TABLE */}
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Package size={15} color="var(--accent-color)" /> Currently Assigned & Active Products ({allHawkerLogs.length} Records):
                              </div>

                              {allHawkerLogs.length === 0 ? (
                                <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                  No product dispatches logged for this hawker yet.
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', margin: 0 }}>
                                    <thead>
                                      <tr style={{ background: '#F2F9F8', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        <th style={{ padding: '0.5rem' }}>Date</th>
                                        <th style={{ padding: '0.5rem' }}>Product Name</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Issued Qty</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Returned Qty</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Damaged Qty</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Sold Qty</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Value</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {allHawkerLogs.map(log => {
                                        const prod = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0, category: 'General' };
                                        const isSettled = log.returned_qty > 0 || log.damaged_qty > 0 || log.cash_collected > 0 || log.sold_qty > 0;
                                        const unitPrice = prod.selling_price || 0;
                                        const totalLineVal = log.dispatched_qty * unitPrice;

                                        return (
                                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem' }}>{log.date}</td>
                                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>
                                              {prod.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({prod.category || 'General'})</span>
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--info-color)' }}>
                                              {log.dispatched_qty}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{log.returned_qty}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: log.damaged_qty > 0 ? 'var(--coral-red)' : 'inherit' }}>
                                              {log.damaged_qty || 0}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--success-color)' }}>
                                              {isSettled ? log.sold_qty : '-'}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{unitPrice.toFixed(2)}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>₹{totalLineVal.toFixed(2)}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                              {isSettled ? (
                                                <span className="badge success" style={{ fontSize: '0.75rem' }}>Settled</span>
                                              ) : (
                                                <span className="badge warning" style={{ fontSize: '0.75rem' }}>Pending Return</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredHawkers.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No hawkers found matching "{search}".
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
          <div className="card" style={{ maxWidth: '850px', width: '100%', border: '1px solid var(--accent-color)', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedHawkerReturnsModal(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--accent-color)" size={20}/> Complete Activity Log: {selectedHawkerReturnsModal.name}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Historical log of dispatches, unsold returns, damaged products, and cash collections for this hawker.
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ margin: 0, fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th>Date</th>
                    <th>Product</th>
                    <th style={{ textAlign: 'center' }}>Issued</th>
                    <th style={{ textAlign: 'center' }}>Returned</th>
                    <th style={{ textAlign: 'center' }}>Damaged</th>
                    <th style={{ textAlign: 'center' }}>Sold</th>
                    <th style={{ textAlign: 'right' }}>Cash Collected</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hawkerReturnsList.map(log => {
                    const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}` };
                    const isSettled = log.returned_qty > 0 || log.damaged_qty > 0 || log.cash_collected > 0 || log.sold_qty > 0;
                    
                    return (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--info-color)' }}>{log.dispatched_qty}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{log.returned_qty}</td>
                        <td style={{ textAlign: 'center', color: log.damaged_qty > 0 ? 'var(--coral-red)' : 'var(--text-secondary)', fontWeight: log.damaged_qty > 0 ? 700 : 400 }}>
                          {log.damaged_qty || 0}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success-color)' }}>
                          {isSettled ? log.sold_qty : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {isSettled ? `₹${log.cash_collected.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isSettled ? (
                            <span className="badge success" style={{ fontSize: '0.75rem' }}>Settled</span>
                          ) : (
                            <span className="badge warning" style={{ fontSize: '0.75rem' }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {hawkerReturnsList.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No activity log entries found for this hawker yet.
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
