import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Banknote, Wallet, Search } from 'lucide-react';

export default function Collections() {
  const [hawkers, setHawkers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
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
      if (hawkersRes.length > 0 && !newCollection.hawker_id) {
        setNewCollection(prev => ({ ...prev, hawker_id: hawkersRes[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/collections/', {
        ...newCollection,
        amount: parseFloat(newCollection.amount)
      });
      setShowAddForm(false);
      setNewCollection(prev => ({ ...prev, amount: '' }));
      fetchData(); // refresh balances
      alert('Payment collected successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to record collection');
    }
  };

  const totalOutstanding = hawkers.reduce((acc, curr) => acc + (curr.balance < 0 ? Math.abs(curr.balance) : 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Collections & Balances</h1>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          <Banknote size={18} /> Record Payment
        </button>
      </div>

      <div className="grid-cols-3" style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Total Outstanding (Owed to Us)</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>₹{totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Record Hawker Payment</h3>
          <form onSubmit={handleCollection} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={newCollection.date} onChange={e => setNewCollection({...newCollection, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hawker</label>
                <select required value={newCollection.hawker_id} onChange={e => setNewCollection({...newCollection, hawker_id: parseInt(e.target.value)})}>
                  {hawkers.map(h => (
                    <option key={h.id} value={h.id}>{h.name} (Balance: ₹{h.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input required type="number" step="0.01" min="0.01" value={newCollection.amount} onChange={e => setNewCollection({...newCollection, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={newCollection.payment_method} onChange={e => setNewCollection({...newCollection, payment_method: e.target.value})}>
                  <option>Cash</option>
                  <option>UPI / Online</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success">Save Payment</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Hawker Balances */}
        <div className="card">
          <h3>Hawker Balances</h3>
          <div style={{ overflowY: 'auto', maxHeight: '400px', marginTop: '1rem' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Hawker</th>
                  <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {hawkers.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }} className={h.balance < 0 ? 'text-danger' : (h.balance > 0 ? 'text-success' : '')}>
                      {h.balance < 0 ? `Owes ₹${Math.abs(h.balance).toFixed(2)}` : (h.balance > 0 ? `Credit ₹${h.balance.toFixed(2)}` : 'Settled')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection History */}
        <div className="card">
          <h3>Collection History</h3>
          <div style={{ overflowY: 'auto', maxHeight: '400px', marginTop: '1rem' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hawker</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {collections.slice().reverse().map(col => {
                  const hawker = hawkers.find(h => h.id === col.hawker_id);
                  return (
                    <tr key={col.id}>
                      <td>{col.date}</td>
                      <td>{hawker?.name}</td>
                      <td className="text-success" style={{ fontWeight: 600 }}>+₹{col.amount.toFixed(2)}</td>
                      <td><span className="badge info">{col.payment_method}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
