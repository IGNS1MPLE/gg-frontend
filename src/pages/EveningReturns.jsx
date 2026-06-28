import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Calculator, CheckSquare, AlertTriangle } from 'lucide-react';

export default function EveningReturns() {
  const [logs, setLogs] = useState([]);
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [returnData, setReturnData] = useState({
    returned_qty: 0,
    cash_collected: 0
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
      
      // Filter for logs that haven't been fully processed yet (or just today's logs)
      // We will show all logs that have dispatched_qty > 0 but haven't collected cash fully maybe.
      // Let's just show today's logs for simplicity, or any log that has returned_qty == 0
      const pendingLogs = logsRes.filter(log => log.returned_qty === 0 && log.cash_collected === 0);
      setLogs(pendingLogs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setReturnData({
      returned_qty: 0,
      cash_collected: 0
    });
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;
    
    try {
      await api.put(`/returns/${selectedLog.id}`, returnData);
      setSelectedLog(null);
      fetchData();
      alert('Return processed successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to process return');
    }
  };

  // Calculations for live preview
  let soldQty = 0;
  let grossRev = 0;
  let hawkerComm = 0;
  let expectedCash = 0;
  let outstanding = 0;
  
  if (selectedLog) {
    const product = products.find(p => p.id === selectedLog.product_id);
    soldQty = selectedLog.dispatched_qty - returnData.returned_qty;
    if (soldQty < 0) soldQty = 0;
    
    if (product) {
      grossRev = soldQty * product.selling_price;
      hawkerComm = soldQty * product.commission_rate;
      expectedCash = grossRev - hawkerComm;
      outstanding = expectedCash - returnData.cash_collected;
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Evening Returns (Settlement)</h1>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Pending Returns List */}
        <div className="card">
          <h3>Pending Settlements</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Select a dispatch log to process returns and collect cash.
          </p>
          
          <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success-color)' }}>
                <CheckSquare size={32} style={{ margin: '0 auto', marginBottom: '1rem' }}/>
                All hawkers are settled for today!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map(log => {
                  const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}` };
                  const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}` };
                  const isSelected = selectedLog?.id === log.id;
                  
                  return (
                    <div 
                      key={log.id} 
                      onClick={() => handleSelectLog(log)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '1rem', 
                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)', 
                        border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`, 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{hawker.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{product.name} | Date: {log.date}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--warning-color)' }}>
                        {log.dispatched_qty} Issued
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Process Return Form */}
        <div className="card">
          <h3>Process Return & Cash</h3>
          
          {!selectedLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)', opacity: 0.5 }}>
              <Calculator size={48} style={{ marginBottom: '1rem' }} />
              Select a pending settlement from the left.
            </div>
          ) : (
            <form onSubmit={handleProcessReturn} className="mt-4 fade-in">
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <strong>Hawker:</strong> {hawkers.find(h => h.id === selectedLog.hawker_id)?.name} <br/>
                <strong>Product:</strong> {products.find(p => p.id === selectedLog.product_id)?.name} <br/>
                <strong>Total Issued:</strong> {selectedLog.dispatched_qty} units
              </div>

              <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label>Returned Quantity (Unsold)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    max={selectedLog.dispatched_qty} 
                    value={returnData.returned_qty} 
                    onChange={e => setReturnData({...returnData, returned_qty: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group">
                  <label>Calculated Sold Quantity</label>
                  <input type="number" readOnly value={soldQty} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--info-color)', fontWeight: 'bold' }} />
                </div>
                
                <div className="form-group">
                  <label>Expected Cash to Collect (₹)</label>
                  <input type="text" readOnly value={`₹${expectedCash.toFixed(2)}`} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--warning-color)', fontWeight: 'bold' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Gross (₹{grossRev.toFixed(2)}) - Comm (₹{hawkerComm.toFixed(2)})
                  </div>
                </div>
                <div className="form-group">
                  <label>Actual Cash Collected (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={returnData.cash_collected} 
                    onChange={e => setReturnData({...returnData, cash_collected: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              
              {outstanding !== 0 && (
                <div style={{ padding: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-color)', borderRadius: '8px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertTriangle color="var(--danger-color)" />
                  <div>
                    <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Outstanding Balance Warning</div>
                    <div style={{ fontSize: '0.875rem' }}>
                      {outstanding > 0 
                        ? `Hawker is short by ₹${outstanding.toFixed(2)}. This will be deducted from their account balance.`
                        : `Hawker overpaid by ₹${Math.abs(outstanding).toFixed(2)}. This will be added to their account balance as credit.`}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
                <CheckSquare size={20} /> Complete Settlement
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
