import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Calculator, CheckSquare, AlertTriangle, FileText, AlertOctagon, 
  CheckCircle2, Search, Package, User, MapPin, DollarSign, Calendar, 
  Filter, List, RotateCcw, ArrowUpRight, Check, X 
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

export default function EveningReturns() {
  const [activeTab, setActiveTab] = useState('settlement'); // 'settlement' | 'hawker_log'
  
  const [pendingLogs, setPendingLogs] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Hawker Log Tab Filters
  const [selectedHawkerFilter, setSelectedHawkerFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  
  // Selected Hawker Group State for Multi-Product Settlement
  const [selectedHawkerGroup, setSelectedHawkerGroup] = useState(null);
  
  // Maps logId -> { returned_qty: 0, damaged_qty: 0 }
  const [returnsState, setReturnsState] = useState({});
  const [cashCollected, setCashCollected] = useState('');
  const [remarks, setRemarks] = useState('');

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

  // Combine all logs
  const allLogs = [...pendingLogs, ...completedLogs];

  // Derive Grouped Pending Hawkers
  const pendingHawkerIds = Array.from(new Set(pendingLogs.map(l => l.hawker_id)));
  
  const pendingHawkerGroups = pendingHawkerIds.map(hId => {
    const logsForHawker = pendingLogs.filter(l => l.hawker_id === hId);
    const hawkerObj = hawkers.find(h => h.id === hId) || { name: `Hawker #${hId}` };
    const totalUnitsIssued = logsForHawker.reduce((sum, l) => sum + l.dispatched_qty, 0);
    const date = logsForHawker[0]?.date || '';
    const route = logsForHawker[0]?.route || hawkerObj.route || 'General Route';
    
    return {
      hawkerId: hId,
      hawkerName: hawkerObj.name,
      contactInfo: hawkerObj.contact_info,
      date,
      route,
      logs: logsForHawker,
      productCount: logsForHawker.length,
      totalUnitsIssued
    };
  });

  // Handle Select Hawker Group for Settlement
  const handleSelectHawkerGroup = (group) => {
    setSelectedHawkerGroup(group);
    
    const initialReturns = {};
    group.logs.forEach(log => {
      initialReturns[log.id] = {
        returned_qty: 0,
        damaged_qty: 0
      };
    });
    setReturnsState(initialReturns);
    setCashCollected('');
    setRemarks('');
  };

  // Update return/damaged for a specific log item in the group
  const handleItemQtyChange = (logId, field, value, maxQty) => {
    const val = Math.max(0, Math.min(maxQty, parseInt(value) || 0));
    setReturnsState(prev => ({
      ...prev,
      [logId]: {
        ...prev[logId],
        [field]: val
      }
    }));
  };

  // Calculate Live Totals for Selected Hawker Group
  let totalIssued = 0;
  let totalReturned = 0;
  let totalDamaged = 0;
  let totalSold = 0;
  let totalExpectedCash = 0;

  if (selectedHawkerGroup) {
    selectedHawkerGroup.logs.forEach(log => {
      const product = products.find(p => p.id === log.product_id);
      const ret = returnsState[log.id]?.returned_qty || 0;
      const dam = returnsState[log.id]?.damaged_qty || 0;
      const sold = Math.max(0, log.dispatched_qty - ret - dam);
      const unitPrice = product ? product.selling_price : 0;
      const commRate = product ? product.commission_rate : 0;
      const netPrice = unitPrice - commRate;

      totalIssued += log.dispatched_qty;
      totalReturned += ret;
      totalDamaged += dam;
      totalSold += sold;
      totalExpectedCash += (sold * netPrice);
    });
  }

  const actualCashNum = parseFloat(cashCollected) || 0;
  const outstandingBalance = totalExpectedCash - actualCashNum;

  // Process Combined Return & Settlement
  const handleProcessHawkerSettlement = async (e) => {
    e.preventDefault();
    if (!selectedHawkerGroup) return;

    for (const log of selectedHawkerGroup.logs) {
      const ret = returnsState[log.id]?.returned_qty || 0;
      const dam = returnsState[log.id]?.damaged_qty || 0;
      if (ret + dam > log.dispatched_qty) {
        const prod = products.find(p => p.id === log.product_id);
        alert(`For product "${prod?.name || 'Item'}", sum of Returned (${ret}) + Damaged (${dam}) cannot exceed Total Issued (${log.dispatched_qty}).`);
        return;
      }
    }

    try {
      let remainingCashToAllocate = actualCashNum;

      for (let i = 0; i < selectedHawkerGroup.logs.length; i++) {
        const log = selectedHawkerGroup.logs[i];
        const isLast = i === selectedHawkerGroup.logs.length - 1;

        const product = products.find(p => p.id === log.product_id);
        const ret = returnsState[log.id]?.returned_qty || 0;
        const dam = returnsState[log.id]?.damaged_qty || 0;
        const sold = Math.max(0, log.dispatched_qty - ret - dam);
        const unitPrice = product ? product.selling_price : 0;
        const commRate = product ? product.commission_rate : 0;
        const lineExpected = sold * (unitPrice - commRate);

        let allocatedCash = 0;
        if (isLast) {
          allocatedCash = remainingCashToAllocate;
        } else {
          allocatedCash = Math.min(remainingCashToAllocate, lineExpected);
          remainingCashToAllocate = Math.max(0, remainingCashToAllocate - allocatedCash);
        }

        await api.put(`/returns/${log.id}`, {
          returned_qty: ret,
          damaged_qty: dam,
          remarks: remarks,
          cash_collected: allocatedCash
        });
      }

      setSelectedHawkerGroup(null);
      fetchData();
      alert(`Settlement completed successfully for ${selectedHawkerGroup.hawkerName}!`);
    } catch (e) {
      console.error(e);
      alert('Failed to process hawker settlement');
    }
  };

  // Filter Hawker Groups by Search Term
  const filteredHawkerGroups = pendingHawkerGroups.filter(group => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesHawker = group.hawkerName.toLowerCase().includes(term);
    const matchesProduct = group.logs.some(l => {
      const prod = products.find(p => p.id === l.product_id);
      return prod && prod.name.toLowerCase().includes(term);
    });
    return matchesHawker || matchesProduct;
  });

  // HAWKER LOG TAB FILTERED LOGS & CALCULATIONS
  const filteredMasterLogs = allLogs.filter(log => {
    const hawker = hawkers.find(h => h.id === log.hawker_id);
    const product = products.find(p => p.id === log.product_id);
    
    // Hawker Filter
    if (selectedHawkerFilter !== 'ALL' && String(log.hawker_id) !== String(selectedHawkerFilter)) {
      return false;
    }
    // Status Filter
    const isSettled = log.returned_qty > 0 || log.damaged_qty > 0 || log.cash_collected > 0 || log.sold_qty > 0;
    if (selectedStatusFilter === 'PENDING' && isSettled) return false;
    if (selectedStatusFilter === 'SETTLED' && !isSettled) return false;
    
    // Date Filter
    if (selectedDateFilter && log.date !== selectedDateFilter) return false;

    // Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchHawker = hawker && hawker.name.toLowerCase().includes(term);
      const matchProduct = product && product.name.toLowerCase().includes(term);
      const matchRoute = log.route && log.route.toLowerCase().includes(term);
      if (!matchHawker && !matchProduct && !matchRoute) return false;
    }

    return true;
  });

  // KPI Calculations for Master Hawker Log Tab
  const logStats = filteredMasterLogs.reduce((acc, log) => {
    const product = products.find(p => p.id === log.product_id);
    const price = product ? product.selling_price : 0;
    const comm = product ? product.commission_rate : 0;
    const sold = log.sold_qty || (log.dispatched_qty - log.returned_qty - log.damaged_qty);
    const expected = sold * (price - comm);

    acc.dispatched += log.dispatched_qty || 0;
    acc.returned += log.returned_qty || 0;
    acc.damaged += log.damaged_qty || 0;
    acc.sold += sold;
    acc.expectedCash += expected;
    acc.cashCollected += log.cash_collected || 0;
    return acc;
  }, { dispatched: 0, returned: 0, damaged: 0, sold: 0, expectedCash: 0, cashCollected: 0 });

  const logOutstanding = logStats.expectedCash - logStats.cashCollected;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evening Returns & Hawker Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Process evening returns, view master hawker activity logs, and track daily inventory settlements.
          </p>
        </div>
      </div>

      {/* TOP TAB NAVIGATION */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '2rem' 
      }}>
        <button 
          className="btn" 
          onClick={() => setActiveTab('settlement')}
          style={{ 
            background: activeTab === 'settlement' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'settlement' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'settlement' ? '2px solid var(--accent-color)' : 'none',
            borderRadius: '10px 10px 0 0',
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Calculator size={18} /> Daily Returns & Settlement
          {pendingHawkerGroups.length > 0 && (
            <span className="badge warning" style={{ marginLeft: '6px', padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>
              {pendingHawkerGroups.length} Pending
            </span>
          )}
        </button>

        <button 
          className="btn" 
          onClick={() => setActiveTab('hawker_log')}
          style={{ 
            background: activeTab === 'hawker_log' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'hawker_log' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'hawker_log' ? '2px solid var(--accent-color)' : 'none',
            borderRadius: '10px 10px 0 0',
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <List size={18} /> 📋 Master Hawker Activity Log
          <span className="badge info" style={{ marginLeft: '6px', padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>
            {allLogs.length} Total Logs
          </span>
        </button>
      </div>

      {/* TAB 1: DAILY RETURNS & SETTLEMENT */}
      {activeTab === 'settlement' && (
        <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
          
          {/* LEFT COLUMN: Pending Hawker Groups List */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--accent-color)" /> Pending Hawker Settlements ({filteredHawkerGroups.length})
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Select a hawker to view all their issued products and process combined returns.
            </p>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search hawker name or product name..."
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            
            <div style={{ overflowY: 'auto', maxHeight: '520px' }}>
              {filteredHawkerGroups.length === 0 ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--success-color)' }}>
                  <CheckSquare size={36} style={{ margin: '0 auto', marginBottom: '0.75rem' }}/>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>All hawkers are settled for today!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredHawkerGroups.map(group => {
                    const isSelected = selectedHawkerGroup?.hawkerId === group.hawkerId;
                    
                    return (
                      <div 
                        key={group.hawkerId} 
                        onClick={() => handleSelectHawkerGroup(group)}
                        style={{ 
                          padding: '1rem', 
                          background: isSelected ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255,255,255,0.02)', 
                          border: `2px solid ${isSelected ? 'var(--mint-cyan)' : 'var(--border-color)'}`, 
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(45, 212, 191, 0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                              {group.hawkerName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                              <MapPin size={12} color="var(--accent-color)" /> {group.route} | Date: {group.date}
                            </div>
                          </div>

                          <span style={{ 
                            fontWeight: 700, 
                            color: 'var(--warning-color)', 
                            fontSize: '0.85rem',
                            background: 'var(--warning-bg)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px'
                          }}>
                            {group.productCount} Products ({group.totalUnitsIssued} Units)
                          </span>
                        </div>

                        {/* Product Preview Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                          {group.logs.map(log => {
                            const prod = products.find(p => p.id === log.product_id);
                            return (
                              <span key={log.id} style={{
                                fontSize: '0.75rem',
                                background: '#F2F9F8',
                                color: 'var(--text-primary)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)'
                              }}>
                                {prod?.name || 'Product'} × {log.dispatched_qty}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Process Multi-Product Returns & Settlement Form */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={20} color="var(--accent-color)" /> Process Combined Returns & Settlement
            </h3>
            
            {!selectedHawkerGroup ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '420px', color: 'var(--text-secondary)', opacity: 0.6 }}>
                <Calculator size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>No Hawker Selected</div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Select a pending hawker from the list on the left to process all their issued products.</div>
              </div>
            ) : (
              <form onSubmit={handleProcessHawkerSettlement} className="mt-4 fade-in">
                {/* Hawker & Route Header Info */}
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'var(--accent-pill)', 
                  color: 'var(--text-primary)', 
                  borderRadius: '12px', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hawker Name:</span>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedHawkerGroup.hawkerName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Route / Date:</span>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{selectedHawkerGroup.route} ({selectedHawkerGroup.date})</div>
                  </div>
                </div>

                {/* Multi-Product Itemized Return Inputs Table */}
                <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#F2F9F8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Issued</th>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', minWidth: '90px' }}>Returned (Good)</th>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', minWidth: '90px' }}>Damaged</th>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Sold</th>
                        <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Expected Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHawkerGroup.logs.map(log => {
                        const prod = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0, commission_rate: 0 };
                        const ret = returnsState[log.id]?.returned_qty || 0;
                        const dam = returnsState[log.id]?.damaged_qty || 0;
                        const sold = Math.max(0, log.dispatched_qty - ret - dam);
                        const lineExpectedCash = sold * (prod.selling_price - prod.commission_rate);

                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prod.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{prod.selling_price.toFixed(2)}/unit</div>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--info-color)' }}>
                              {log.dispatched_qty}
                            </td>
                            <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max={log.dispatched_qty} 
                                value={returnsState[log.id]?.returned_qty ?? 0}
                                onChange={e => handleItemQtyChange(log.id, 'returned_qty', e.target.value, log.dispatched_qty)}
                                style={{ padding: '0.4rem', textAlign: 'center', borderRadius: '8px', fontSize: '0.875rem' }}
                              />
                            </td>
                            <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max={log.dispatched_qty} 
                                value={returnsState[log.id]?.damaged_qty ?? 0}
                                onChange={e => handleItemQtyChange(log.id, 'damaged_qty', e.target.value, log.dispatched_qty)}
                                style={{ padding: '0.4rem', textAlign: 'center', borderRadius: '8px', fontSize: '0.875rem', color: dam > 0 ? 'var(--coral-red)' : 'inherit', fontWeight: dam > 0 ? 700 : 400 }}
                              />
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '9999px', 
                                background: 'var(--success-bg)', 
                                color: 'var(--success-color)', 
                                fontWeight: 800 
                              }}>
                                {sold}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-color)' }}>
                              ₹{lineExpectedCash.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Combined Totals Summary Box */}
                <div style={{
                  background: '#F2F9F8',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Auto-Calculated Hawker Summary ({selectedHawkerGroup.productCount} Products)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
                    <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Issued</div>
                      <strong style={{ color: 'var(--info-color)', fontSize: '1rem' }}>{totalIssued}</strong>
                    </div>
                    <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Returned</div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{totalReturned}</strong>
                    </div>
                    <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--coral-red)' }}>Damaged</div>
                      <strong style={{ color: 'var(--coral-red)', fontSize: '1rem' }}>{totalDamaged}</strong>
                    </div>
                    <div style={{ background: '#FFF', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>Total Sold</div>
                      <strong style={{ color: 'var(--success-color)', fontSize: '1rem' }}>{totalSold}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Total Expected Cash to Collect:</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--warning-color)' }}>₹{totalExpectedCash.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Remarks & Cash Inputs */}
                <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Remarks / Damage Notes</label>
                    <input 
                      type="text" 
                      value={remarks} 
                      onChange={e => setRemarks(e.target.value)} 
                      placeholder="e.g. 2 units damaged during transit"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Actual Cash Collected (₹) *</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder={`e.g. ${totalExpectedCash.toFixed(2)}`}
                      value={cashCollected} 
                      onChange={e => setCashCollected(e.target.value)} 
                      style={{ fontWeight: 700, fontSize: '1.05rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                </div>
                
                {/* Balance Warning Alert */}
                {cashCollected !== '' && outstandingBalance !== 0 && (
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    background: outstandingBalance > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', 
                    border: `1px solid ${outstandingBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)'}`, 
                    borderRadius: '10px', 
                    marginTop: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem' 
                  }}>
                    <AlertTriangle color={outstandingBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)'} size={20} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: outstandingBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold' }}>
                        {outstandingBalance > 0 ? 'Outstanding Balance Warning' : 'Overpayment / Credit Alert'}
                      </div>
                      <div>
                        {outstandingBalance > 0 
                          ? `Cash received is short by ₹${outstandingBalance.toFixed(2)} (will be deducted from Hawker account balance).`
                          : `Cash received exceeds expected by ₹${Math.abs(outstandingBalance).toFixed(2)} (added as Hawker account credit).`}
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem', fontSize: '1rem', fontWeight: 800 }}>
                  <CheckSquare size={18} /> Complete Settlement & Update Inventory for All Products
                </button>
              </form>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: MASTER HAWKER ACTIVITY LOG TAB */}
      {activeTab === 'hawker_log' && (
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <List size={22} color="var(--accent-color)" /> Master Hawker Activity Log & History
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Comprehensive record displaying dispatches, returns, sales, revenue, and cash collections for all hawkers.
              </p>
            </div>

            {/* Filter Reset Button */}
            {(selectedHawkerFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedDateFilter || searchTerm) && (
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSelectedHawkerFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSelectedDateFilter('');
                  setSearchTerm('');
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* FILTERS PANEL */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            background: '#F2F9F8',
            padding: '1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Filter Hawker */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                Filter by Hawker:
              </label>
              <select 
                value={selectedHawkerFilter} 
                onChange={e => setSelectedHawkerFilter(e.target.value)}
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <option value="ALL">-- All Hawkers ({hawkers.length}) --</option>
                {hawkers.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                Filter Status:
              </label>
              <select 
                value={selectedStatusFilter} 
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Settlement</option>
                <option value="SETTLED">Settled</option>
              </select>
            </div>

            {/* Filter Date */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                Filter Date:
              </label>
              <input 
                type="date" 
                value={selectedDateFilter} 
                onChange={e => setSelectedDateFilter(e.target.value)}
                style={{ backgroundColor: '#FFFFFF' }}
              />
            </div>

            {/* Search Input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                Search Text:
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Hawker, Product, Route..."
                  style={{ paddingLeft: '2.5rem', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          {/* HAWKER LOG KPI SUMMARY BAR */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '0.75rem', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dispatched</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--info-color)' }}>{logStats.dispatched}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Returned Unsold</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{logStats.returned}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--coral-red)', fontWeight: 600 }}>Damaged</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--coral-red)' }}>{logStats.damaged}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 600 }}>Total Sold</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success-color)' }}>{logStats.sold}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Expected Cash</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning-color)' }}>₹{logStats.expectedCash.toFixed(2)}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cash Collected</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)' }}>₹{logStats.cashCollected.toFixed(2)}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Balance Diff</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: logOutstanding > 0 ? 'var(--coral-red)' : 'var(--success-color)' }}>
                ₹{logOutstanding.toFixed(2)}
              </div>
            </div>
          </div>

          {/* MASTER HAWKER EVERYTHING TABLE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr style={{ textTransform: 'uppercase', fontSize: '0.775rem' }}>
                  <th>Date</th>
                  <th>Hawker Name</th>
                  <th>Route</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'center' }}>Issued</th>
                  <th style={{ textAlign: 'center' }}>Returned</th>
                  <th style={{ textAlign: 'center' }}>Damaged</th>
                  <th style={{ textAlign: 'center' }}>Sold</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Expected Payment</th>
                  <th style={{ textAlign: 'right' }}>Cash Collected</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasterLogs.map(log => {
                  const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}` };
                  const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0, commission_rate: 0 };
                  
                  const isSettled = log.returned_qty > 0 || log.damaged_qty > 0 || log.cash_collected > 0 || log.sold_qty > 0;
                  const sold = isSettled ? log.sold_qty : 0;
                  const netPrice = product.selling_price - product.commission_rate;
                  const expectedPay = sold * netPrice;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem' }}>{log.date}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hawker.name}</td>
                      <td style={{ fontSize: '0.85rem' }}>{log.route || hawker.route || 'General'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{product.category || 'General'}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--info-color)', background: 'var(--info-bg)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          {log.dispatched_qty}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: log.returned_qty > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {log.returned_qty || 0}
                      </td>
                      <td style={{ textAlign: 'center', color: log.damaged_qty > 0 ? 'var(--coral-red)' : 'var(--text-secondary)', fontWeight: log.damaged_qty > 0 ? 700 : 400 }}>
                        {log.damaged_qty || 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: isSettled ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                          {isSettled ? sold : '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>₹{product.selling_price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--warning-color)' }}>
                        {isSettled ? `₹${expectedPay.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success-color)' }}>
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

                {filteredMasterLogs.length === 0 && (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No hawker activity log records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
