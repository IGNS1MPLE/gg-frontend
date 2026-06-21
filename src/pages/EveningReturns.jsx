import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ClipboardCheck } from 'lucide-react';

export default function EveningReturns() {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState({});
  const [sellers, setSellers] = useState({});
  
  const [returnLogId, setReturnLogId] = useState('');
  const [returnQty, setReturnQty] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [l, p, s] = await Promise.all([
        api.get('/logs/'),
        api.get('/products/'),
        api.get('/sellers/')
      ]);
      setLogs(l);
      
      const productLookup = {};
      p.forEach(x => productLookup[x.id] = x);
      setProducts(productLookup);
      
      const sellerLookup = {};
      s.forEach(x => sellerLookup[x.id] = x.name);
      setSellers(sellerLookup);
    } catch (e) { console.error(e); }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    await api.put(`/returns/${returnLogId}`, { returned_qty: parseInt(returnQty) });
    setReturnLogId('');
    setReturnQty('');
    fetchData();
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Active logs (for the dropdown)
  const activeLogs = logs.filter(l => l.date === today && l.returned_qty === 0 && l.sold_qty === 0);
  
  // Completed logs for today (for the summary table)
  const completedLogs = logs.filter(l => l.date === today && (l.sold_qty > 0 || l.returned_qty > 0));

  // Calculate daily amount sold per seller
  const sellerTotals = {};
  completedLogs.forEach(log => {
    if (!sellerTotals[log.seller_id]) {
      sellerTotals[log.seller_id] = { name: sellers[log.seller_id], totalSoldQty: 0, totalRevenue: 0, totalPayout: 0 };
    }
    sellerTotals[log.seller_id].totalSoldQty += log.sold_qty;
    sellerTotals[log.seller_id].totalRevenue += log.gross_revenue;
    sellerTotals[log.seller_id].totalPayout += log.seller_payout;
  });

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ClipboardCheck size={28} /> Evening Returns
      </h1>

      <div className="leaderboard-grid">
        <div className="card">
          <h2 style={{marginBottom: '1rem'}}>Log Return (Reconciliation)</h2>
          <form onSubmit={handleReturn}>
            <div className="form-group">
              <select required value={returnLogId} onChange={e => setReturnLogId(e.target.value)}>
                <option value="">Select Active Dispatch Log</option>
                {activeLogs.map(l => (
                  <option key={l.id} value={l.id}>
                    {sellers[l.seller_id]} | {products[l.product_id]?.name} | Dispatched: {l.dispatched_qty}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <input type="number" placeholder="Returned Qty" required value={returnQty} onChange={e => setReturnQty(e.target.value)} />
            </div>
            <button className="btn" style={{backgroundColor: 'var(--success-color)'}} type="submit">Complete Settlement</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{marginBottom: '1rem'}}>Today's Seller Summary</h2>
          {Object.values(sellerTotals).length === 0 ? (
            <p style={{color: 'var(--text-secondary)'}}>No returns processed today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.values(sellerTotals).map((s, idx) => (
                <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{s.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Items Sold: <strong style={{color: 'var(--text-primary)'}}>{s.totalSoldQty}</strong></span>
                      <span>Total Revenue: <strong style={{color: 'var(--success-color)'}}>{formatter.format(s.totalRevenue)}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                      <span>Commission to Pay: <strong style={{color: 'var(--danger-color)'}}>{formatter.format(s.totalPayout)}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
        <h2 style={{marginBottom: '1rem'}}>Return History (Today)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Seller</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Product</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Dispatched</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Returned</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Sold</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Revenue</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Cost (COGS)</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Commission</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {completedLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No returns processed yet.
                </td>
              </tr>
            ) : completedLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.5rem' }}>{sellers[log.seller_id]}</td>
                <td style={{ padding: '0.75rem 0.5rem' }}>{products[log.product_id]?.name}</td>
                <td style={{ padding: '0.75rem 0.5rem' }}>{log.dispatched_qty}</td>
                <td style={{ padding: '0.75rem 0.5rem' }}>{log.returned_qty}</td>
                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{log.sold_qty}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--success-color)' }}>{formatter.format(log.gross_revenue)}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{formatter.format(log.sold_qty * (products[log.product_id]?.base_cost || 0))}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--danger-color)', fontWeight: 'bold' }}>{formatter.format(log.seller_payout)}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--success-color)', fontWeight: 'bold' }}>{formatter.format(log.net_profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
