import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Calculator, CheckSquare, AlertTriangle, FileText, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function EveningReturns() {
  const [pendingLogs, setPendingLogs] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [returnData, setReturnData] = useState({
    returned_qty: 0,
    damaged_qty: 0,
    remarks: '',
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
      
      // Filter pending dispatches (returns not yet processed or settled)
      const pending = logsRes.filter(log => log.returned_qty === 0 && log.damaged_qty === 0 && log.cash_collected === 0 && log.sold_qty === 0);
      const completed = logsRes.filter(log => log.returned_qty > 0 || log.damaged_qty > 0 || log.cash_collected > 0 || log.sold_qty > 0);
      
      setPendingLogs(pending);
      setCompletedLogs(completed);
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
      damaged_qty: 0,
      remarks: '',
      cash_collected: 0
    });
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;
    
    // Validation
    const totalReturnedAndDamaged = (returnData.returned_qty || 0) + (returnData.damaged_qty || 0);
    if (totalReturnedAndDamaged > selectedLog.dispatched_qty) {
      alert(`Total of Returned Unsold (${returnData.returned_qty}) and Damaged (${returnData.damaged_qty}) cannot exceed Total Issued (${selectedLog.dispatched_qty}).`);
      return;
    }

    try {
      await api.put(`/returns/${selectedLog.id}`, returnData);
      setSelectedLog(null);
      fetchData();
      alert('Return & Settlement completed successfully!');
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
    const retQty = parseInt(returnData.returned_qty) || 0;
    const damQty = parseInt(returnData.damaged_qty) || 0;
    
    soldQty = selectedLog.dispatched_qty - retQty - damQty;
    if (soldQty < 0) soldQty = 0;
    
    if (product) {
      grossRev = soldQty * product.selling_price;
      hawkerComm = soldQty * product.commission_rate;
      expectedCash = grossRev - hawkerComm;
      outstanding = expectedCash - (parseFloat(returnData.cash_collected) || 0);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evening Returns & Settlement Module</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Process unsold & damaged products, automatically update inventory, and collect daily payments.
          </p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Pending Settlements List */}
        <div className="card">
          <h3>Pending Evening Settlements</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Select an issued dispatch log to process returned & damaged items.
          </p>
          
          <div style={{ overflowY: 'auto', maxHeight: '550px' }}>
            {pendingLogs.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--success-color)' }}>
                <CheckSquare size={36} style={{ margin: '0 auto', marginBottom: '0.75rem' }}/>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>All hawkers are settled for today!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingLogs.map(log => {
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
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)', 
                        border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`, 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{hawker.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Product: <strong>{product.name}</strong> | Date: {log.date}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--warning-color)', fontSize: '1.1rem' }}>
                        {log.dispatched_qty} Issued
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Process Return & Damaged Products Form */}
        <div className="card">
          <h3>Process Returns & Settlement</h3>
          
          {!selectedLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', color: 'var(--text-secondary)', opacity: 0.5 }}>
              <Calculator size={48} style={{ marginBottom: '1rem' }} />
              Select a pending settlement from the list on the left.
            </div>
          ) : (
            <form onSubmit={handleProcessReturn} className="mt-4 fade-in">
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Hawker:</span> <strong>{hawkers.find(h => h.id === selectedLog.hawker_id)?.name}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Date:</span> <strong>{selectedLog.date}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Product:</span> <strong>{products.find(p => p.id === selectedLog.product_id)?.name}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Total Issued:</span> <strong style={{ color: 'var(--info-color)' }}>{selectedLog.dispatched_qty} units</strong></div>
                </div>
              </div>

              <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label>Returned Qty (Unsold - Good Condition)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    max={selectedLog.dispatched_qty} 
                    value={returnData.returned_qty} 
                    onChange={e => setReturnData({...returnData, returned_qty: parseInt(e.target.value) || 0})} 
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Restores sellable stock</div>
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertOctagon size={14} /> Damaged Qty (Recorded Separately)
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max={selectedLog.dispatched_qty} 
                    value={returnData.damaged_qty} 
                    onChange={e => setReturnData({...returnData, damaged_qty: parseInt(e.target.value) || 0})} 
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Not added to sellable stock</div>
                </div>

                <div className="form-group">
                  <label>Calculated Sold Quantity</label>
                  <input type="number" readOnly value={soldQty} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--info-color)', fontWeight: 'bold' }} />
                </div>
                
                <div className="form-group">
                  <label>Expected Cash to Collect (₹)</label>
                  <input type="text" readOnly value={`₹${expectedCash.toFixed(2)}`} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--warning-color)', fontWeight: 'bold' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Remarks / Damage Notes</label>
                <input 
                  type="text" 
                  value={returnData.remarks} 
                  onChange={e => setReturnData({...returnData, remarks: e.target.value})} 
                  placeholder="e.g. 2 units torn/damaged during transit"
                />
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
              
              {outstanding !== 0 && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-color)', borderRadius: '8px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle color="var(--danger-color)" size={20} />
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Outstanding Balance Warning</div>
                    <div>
                      {outstanding > 0 
                        ? `Short by ₹${outstanding.toFixed(2)} (deducted from account balance).`
                        : `Overpaid by ₹${Math.abs(outstanding).toFixed(2)} (added as credit).`}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem', fontSize: '1rem' }}>
                <CheckSquare size={18} /> Complete Settlement & Update Inventory
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Completed Settlements Log / History */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} color="var(--success-color)" /> Completed Evening Settlements Log
        </h3>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hawker</th>
                <th>Product</th>
                <th>Issued</th>
                <th>Returned Qty</th>
                <th>Damaged Qty</th>
                <th>Sold Qty</th>
                <th>Remarks</th>
                <th>Cash Collected</th>
              </tr>
            </thead>
            <tbody>
              {completedLogs.map(log => {
                const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}` };
                const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}` };

                return (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td style={{ fontWeight: 600 }}>{hawker.name}</td>
                    <td>{product.name}</td>
                    <td>{log.dispatched_qty}</td>
                    <td style={{ color: 'var(--info-color)', fontWeight: 600 }}>{log.returned_qty}</td>
                    <td style={{ color: log.damaged_qty > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: log.damaged_qty > 0 ? 700 : 400 }}>
                      {log.damaged_qty || 0}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success-color)' }}>{log.sold_qty}</td>
                    <td>{log.remarks || '-'}</td>
                    <td style={{ fontWeight: 600 }}>₹{log.cash_collected.toFixed(2)}</td>
                  </tr>
                );
              })}

              {completedLogs.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No completed settlements recorded yet.
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
