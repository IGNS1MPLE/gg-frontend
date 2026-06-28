import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Send, Search, CheckCircle } from 'lucide-react';

export default function DailyDistribution() {
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [dispatchData, setDispatchData] = useState({
    date: new Date().toISOString().split('T')[0],
    hawker_id: '',
    product_id: '',
    dispatched_qty: 1
  });

  const fetchData = async () => {
    try {
      const [hawkersRes, productsRes, logsRes] = await Promise.all([
        api.get('/hawkers/'),
        api.get('/products/'),
        api.get('/logs/')
      ]);
      setHawkers(hawkersRes.filter(h => h.status)); // Only active hawkers
      setProducts(productsRes);
      
      // Filter for today's dispatches
      const today = new Date().toISOString().split('T')[0];
      setLogs(logsRes.filter(log => log.date === today));
      
      if (hawkersRes.length > 0 && !dispatchData.hawker_id) {
        setDispatchData(prev => ({ ...prev, hawker_id: hawkersRes.find(h => h.status)?.id || '' }));
      }
      if (productsRes.length > 0 && !dispatchData.product_id) {
        setDispatchData(prev => ({ ...prev, product_id: productsRes[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dispatch/', dispatchData);
      // Reset qty
      setDispatchData(prev => ({ ...prev, dispatched_qty: 1 }));
      fetchData();
      alert('Stock successfully issued!');
    } catch (e) {
      console.error(e);
      alert('Failed to dispatch stock');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Morning Issue (Distribution)</h1>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Issue Form */}
        <div className="card">
          <h3>Issue Stock to Hawker</h3>
          <form onSubmit={handleDispatch} className="mt-4">
            <div className="form-group">
              <label>Date</label>
              <input required type="date" value={dispatchData.date} onChange={e => setDispatchData({...dispatchData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Hawker</label>
              <select required value={dispatchData.hawker_id} onChange={e => setDispatchData({...dispatchData, hawker_id: parseInt(e.target.value)})}>
                {hawkers.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product</label>
              <select required value={dispatchData.product_id} onChange={e => setDispatchData({...dispatchData, product_id: parseInt(e.target.value)})}>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity to Issue</label>
              <input required type="number" min="1" value={dispatchData.dispatched_qty} onChange={e => setDispatchData({...dispatchData, dispatched_qty: parseInt(e.target.value)})} />
            </div>
            
            <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }}>
              <Send size={18} /> Issue Stock & Update Inventory
            </button>
          </form>
        </div>

        {/* Today's Dispatches List */}
        <div className="card">
          <h3>Today's Issued Slips</h3>
          <div style={{ overflowY: 'auto', maxHeight: '500px', marginTop: '1rem' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No stock issued today yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map(log => {
                  const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}` };
                  const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}` };
                  
                  return (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{hawker.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{product.name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--info-color)' }}>{log.dispatched_qty} units</span>
                        {log.returned_qty > 0 ? (
                          <span className="badge success" title="Returns processed"><CheckCircle size={14}/></span>
                        ) : (
                          <span className="badge warning">Pending Return</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
