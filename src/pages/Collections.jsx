import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Banknote, Search, Trash2, User, Pencil, Clock, 
  CheckCircle2, AlertTriangle, Calendar, Info, X, ChevronRight, FileText
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import EditCollectionModal from '../components/EditCollectionModal';

export default function Collections() {
  const [hawkers, setHawkers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedAuditCol, setSelectedAuditCol] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [newCollection, setNewCollection] = useState({
    date: new Date().toISOString().split('T')[0],
    hawker_id: '',
    amount: '',
    payment_method: 'Cash'
  });

  const fetchData = async () => {
    try {
      const [hawkersRes, colRes] = await Promise.all([
        api.get('/hawkers/'),
        api.get('/collections/')
      ]);
      setHawkers(hawkersRes);
      setCollections(colRes);
    } catch (e) {
      console.error('Error fetching collections data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleDelete = async (id) => {
    const colToDelete = collections.find(c => c.id === id);
    const hawkerName = hawkers.find(h => h.id === colToDelete?.hawker_id)?.name || 'this hawker';
    const amountStr = colToDelete ? `₹${colToDelete.amount.toFixed(2)}` : '';

    if (window.confirm(`Are you sure you want to delete payment entry #COL-${id} (${amountStr} from ${hawkerName})?\n\nThis will reverse the payment and adjust ${hawkerName}'s balance accordingly.`)) {
      try {
        await api.delete(`/collections/${id}`);
        await fetchData();
        showToast(`Payment #COL-${id} deleted and hawker balance adjusted successfully.`);
      } catch (e) {
        console.error(e);
        alert("Failed to delete collection.");
      }
    }
  };

  const handleCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.hawker_id) {
      alert('Please select a hawker');
      return;
    }
    const amt = parseFloat(newCollection.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!newCollection.payment_method) {
      alert('Please select a payment method');
      return;
    }

    try {
      await api.post('/collections/', {
        ...newCollection,
        amount: amt
      });
      setShowAddForm(false);
      setNewCollection({
        date: new Date().toISOString().split('T')[0],
        hawker_id: '',
        amount: '',
        payment_method: 'Cash'
      });
      await fetchData(); // refresh balances
      showToast('Payment collected and credited to hawker balance successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to record collection');
    }
  };

  // KPIs
  const totalOutstanding = hawkers.reduce((acc, curr) => acc + (curr.balance < 0 ? Math.abs(curr.balance) : 0), 0);
  const totalCollectedAllTime = collections.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const totalCollectedToday = collections
    .filter(c => c.date === todayStr)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Filter collections
  const filteredCollections = collections
    .slice()
    .reverse()
    .filter(col => {
      if (!historySearch.trim()) return true;
      const term = historySearch.toLowerCase();
      const hawker = hawkers.find(h => h.id === col.hawker_id);
      const hawkerName = hawker?.name?.toLowerCase() || '';
      const method = (col.payment_method || '').toLowerCase();
      const date = col.date || '';
      const idStr = `col-${col.id}`;
      const amountStr = String(col.amount);
      return hawkerName.includes(term) || method.includes(term) || date.includes(term) || idStr.includes(term) || amountStr.includes(term);
    });

  return (
    <div className="fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toastMessage.type === 'success' ? '#065F46' : '#991B1B',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 2000,
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <CheckCircle2 size={18} color="#A7F3D0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections & Balances</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Record payments, review hawker balances, and edit cash or online collections with automatic ledger adjustments.
          </p>
        </div>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          <Banknote size={18} /> {showAddForm ? 'Close Form' : 'Record Payment'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-3" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderLeft: '4px solid var(--danger-color)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Outstanding (Owed to Us)</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--danger-color)' }}>
            ₹{totalOutstanding.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Across {hawkers.filter(h => h.balance < 0).length} hawkers with negative balances
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderLeft: '4px solid var(--mint-cyan)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Collected Today ({todayStr})</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{totalCollectedToday.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {collections.filter(c => c.date === todayStr).length} payment receipts recorded today
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderLeft: '4px solid var(--success-color)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Direct Collections (All Time)</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success-color)' }}>
            ₹{totalCollectedAllTime.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {collections.length} total payment transactions recorded
          </div>
        </div>
      </div>

      {/* Record Payment Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--mint-cyan)', animation: 'fadeIn 0.2s ease-in' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Banknote size={20} color="var(--accent-color)" /> Record Hawker Payment
            </h3>
            <button 
              onClick={() => setShowAddForm(false)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleCollection} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Date *</label>
                <input required type="date" value={newCollection.date} onChange={e => setNewCollection({...newCollection, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hawker (Searchable) *</label>
                <SearchableSelect
                  options={hawkers.map(h => ({ 
                    value: h.id, 
                    label: h.name, 
                    sublabel: h.balance < 0 ? `Owes ₹${Math.abs(h.balance).toFixed(2)}` : (h.balance > 0 ? `Credit ₹${h.balance.toFixed(2)}` : 'Settled')
                  }))}
                  value={newCollection.hawker_id}
                  onChange={(val) => setNewCollection({...newCollection, hawker_id: val ? parseInt(val) : ''})}
                  placeholder="Search or select hawker..."
                  required
                  icon={User}
                />
              </div>
              <div className="form-group">
                <label>Amount Received (₹) *</label>
                <input required type="number" step="0.01" min="0.01" placeholder="0.00" value={newCollection.amount} onChange={e => setNewCollection({...newCollection, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select required value={newCollection.payment_method} onChange={e => setNewCollection({...newCollection, payment_method: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-success">Save Payment</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Hawker Balances Column */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Hawker Balances</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {hawkers.length} Hawkers Registered
            </span>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '520px', marginTop: '0.75rem' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Hawker</th>
                  <th>Route</th>
                  <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {hawkers.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h.route || 'General'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }} className={h.balance < 0 ? 'text-danger' : (h.balance > 0 ? 'text-success' : '')}>
                      {h.balance < 0 ? `Owes ₹${Math.abs(h.balance).toFixed(2)}` : (h.balance > 0 ? `Credit ₹${h.balance.toFixed(2)}` : 'Settled')}
                    </td>
                  </tr>
                ))}
                {hawkers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No hawkers recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection History Column */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Collection History</h3>
            
            {/* Search Filter in History */}
            <div className="topbar-search" style={{ margin: 0, padding: '0.35rem 0.85rem', width: '220px' }}>
              <Search size={15} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search history..." 
                value={historySearch} 
                onChange={e => setHistorySearch(e.target.value)} 
                style={{ fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '520px', marginTop: '0.75rem' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hawker</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map(col => {
                  const hawker = hawkers.find(h => h.id === col.hawker_id);
                  const isModified = !!col.is_edited;
                  const hasAmountDiff = isModified && col.original_amount !== null && col.original_amount !== undefined && Math.abs(col.original_amount - col.amount) > 0.001;

                  return (
                    <tr key={col.id} style={{ background: isModified ? 'rgba(245, 158, 11, 0.03)' : 'transparent' }}>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{col.date}</td>
                      <td style={{ fontWeight: 600 }}>
                        {hawker?.name || `Hawker #${col.hawker_id}`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-success" style={{ fontWeight: 700 }}>
                            +₹{col.amount.toFixed(2)}
                          </span>
                          {hasAmountDiff && (
                            <span 
                              style={{ 
                                fontSize: '0.725rem', 
                                color: 'var(--text-secondary)', 
                                textDecoration: 'line-through' 
                              }}
                              title={`Original recorded amount: ₹${col.original_amount.toFixed(2)}`}
                            >
                              orig: ₹{col.original_amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge info" style={{ fontSize: '0.725rem' }}>
                          {col.payment_method}
                        </span>
                      </td>
                      <td>
                        {isModified ? (
                          <button
                            type="button"
                            onClick={() => setSelectedAuditCol(col)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer'
                            }}
                            title="Click to view modification audit trail"
                          >
                            <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem' }}>
                              <Clock size={11} /> Edited
                            </span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Original
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {/* Edit Button */}
                        <button 
                          className="btn btn-secondary" 
                          style={{ 
                            padding: '0.4rem 0.55rem', 
                            marginRight: '0.4rem', 
                            color: 'var(--text-primary)',
                            borderRadius: '8px'
                          }} 
                          title="Edit Payment Entry & Recalculate Balances" 
                          onClick={() => setEditingCollection(col)}
                        >
                          <Pencil size={15} />
                        </button>

                        {/* Delete Button */}
                        <button 
                          className="btn btn-secondary" 
                          style={{ 
                            padding: '0.4rem 0.55rem', 
                            color: 'var(--danger-color)',
                            borderRadius: '8px'
                          }} 
                          title="Delete Payment Entry" 
                          onClick={() => handleDelete(col.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCollections.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      {historySearch ? `No payments found matching "${historySearch}"` : "No collection entries recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit Collection Modal */}
      {editingCollection && (
        <EditCollectionModal
          isOpen={!!editingCollection}
          collection={editingCollection}
          hawkers={hawkers}
          onClose={() => setEditingCollection(null)}
          onSuccess={async (updated) => {
            await fetchData();
            showToast(`Payment #COL-${updated.id} updated successfully! Hawker balance and outstanding figures were recalculated.`);
          }}
        />
      )}

      {/* Audit Detail Popover Modal */}
      {selectedAuditCol && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <Clock size={18} color="var(--warning-color)" /> Payment Audit Trail
              </div>
              <button onClick={() => setSelectedAuditCol(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', color: '#92400E' }}>
                Transaction Ref: <strong>#COL-{selectedAuditCol.id}</strong> was modified after recording.
              </div>

              <div>
                <strong>Current Value:</strong> ₹{selectedAuditCol.amount.toFixed(2)} ({selectedAuditCol.payment_method}) on {selectedAuditCol.date}
              </div>

              {selectedAuditCol.original_amount !== null && (
                <div>
                  <strong>Original Recorded Amount:</strong> ₹{selectedAuditCol.original_amount?.toFixed(2)}
                </div>
              )}

              {selectedAuditCol.original_date && (
                <div>
                  <strong>Original Date:</strong> {selectedAuditCol.original_date}
                </div>
              )}

              {selectedAuditCol.original_hawker_id && (
                <div>
                  <strong>Original Hawker:</strong> {hawkers.find(h => h.id === selectedAuditCol.original_hawker_id)?.name || `#${selectedAuditCol.original_hawker_id}`}
                </div>
              )}

              {selectedAuditCol.edited_at && (
                <div>
                  <strong>Modified On:</strong> {new Date(selectedAuditCol.edited_at).toLocaleString()}
                </div>
              )}

              <div>
                <strong>Reason / Notes:</strong> {selectedAuditCol.edit_reason || 'Manual administrative correction'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAuditCol(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
