import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Send, CheckCircle, FileText, Share2, Printer, MapPin, Tag, Package, DollarSign, Calendar, User, X } from 'lucide-react';

export default function DailyDistribution() {
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  
  const [dispatchData, setDispatchData] = useState({
    date: new Date().toISOString().split('T')[0],
    hawker_id: '',
    route: '',
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
      
      const activeHawkers = hawkersRes.filter(h => h.status);
      setHawkers(activeHawkers);
      setProducts(productsRes);
      
      // Filter for today's dispatches
      const today = new Date().toISOString().split('T')[0];
      setLogs(logsRes.filter(log => log.date === today));
      
      if (activeHawkers.length > 0 && !dispatchData.hawker_id) {
        const firstHawker = activeHawkers[0];
        setDispatchData(prev => ({ 
          ...prev, 
          hawker_id: firstHawker.id,
          route: firstHawker.route || ''
        }));
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

  const handleHawkerChange = (hawkerId) => {
    const selectedHawker = hawkers.find(h => h.id === hawkerId);
    setDispatchData(prev => ({
      ...prev,
      hawker_id: hawkerId,
      route: selectedHawker?.route || ''
    }));
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      const createdLog = await api.post('/dispatch/', dispatchData);
      
      // Update hawkers local state to reflect updated route if modified
      setHawkers(prev => prev.map(h => h.id === dispatchData.hawker_id ? { ...h, route: dispatchData.route } : h));
      
      fetchData();
      
      // Show Slip Modal immediately for newly generated slip
      const selectedHawker = hawkers.find(h => h.id === dispatchData.hawker_id) || {};
      const selectedProduct = products.find(p => p.id === dispatchData.product_id) || {};
      setActiveSlipModal({
        logId: createdLog.id,
        date: dispatchData.date,
        hawkerName: selectedHawker.name || 'Hawker',
        contactInfo: selectedHawker.contact_info || '',
        route: dispatchData.route || 'General Route',
        category: selectedProduct.category || 'General',
        productName: selectedProduct.name || 'Product',
        unitPrice: selectedProduct.selling_price || 0,
        qty: dispatchData.dispatched_qty,
        totalValue: (selectedProduct.selling_price || 0) * dispatchData.dispatched_qty
      });

      // Reset qty
      setDispatchData(prev => ({ ...prev, dispatched_qty: 1 }));
    } catch (e) {
      console.error(e);
      alert('Failed to issue stock');
    }
  };

  // Derive categories list
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'General')))];
  
  const filteredProducts = selectedCategory === 'ALL' 
    ? products 
    : products.filter(p => (p.category || 'General') === selectedCategory);

  // Selected Product & Hawker details for live calculation
  const currentHawker = hawkers.find(h => h.id === dispatchData.hawker_id);
  const currentProduct = products.find(p => p.id === dispatchData.product_id);
  const unitPrice = currentProduct ? currentProduct.selling_price : 0;
  const totalValue = (dispatchData.dispatched_qty || 0) * unitPrice;

  // Format WhatsApp Share Message
  const buildWhatsAppShareLink = (slip) => {
    const textMessage = `*DAILY DISTRIBUTION - MORNING ISSUE SLIP*
----------------------------------------
📅 *Date:* ${slip.date}
👤 *Hawker:* ${slip.hawkerName}
📍 *Route:* ${slip.route || 'N/A'}
🏷️ *Category:* ${slip.category || 'General'}
📦 *Product:* ${slip.productName}
🔢 *Quantity Issued:* ${slip.qty} units
💵 *Unit Price:* ₹${Number(slip.unitPrice).toFixed(2)}
----------------------------------------
💰 *Total Value:* ₹${Number(slip.totalValue).toFixed(2)}
----------------------------------------
_Issued via Inventory Management System_`;

    const encoded = encodeURIComponent(textMessage);
    
    // Check if phone number is available in hawker contact info
    const phoneDigits = slip.contactInfo ? slip.contactInfo.replace(/\D/g, '') : '';
    if (phoneDigits && phoneDigits.length >= 10) {
      return `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`;
    }
    return `https://web.whatsapp.com/send?text=${encoded}`;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Distribution Module</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Morning Issue Slip Generation & WhatsApp Distribution
          </p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Issue Form & Real-time Live Calculation */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--accent-color)" /> Issue Stock (Morning Slip)
          </h3>

          <form onSubmit={handleDispatch} className="mt-4">
            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} /> Date
                </label>
                <input required type="date" value={dispatchData.date} onChange={e => setDispatchData({...dispatchData, date: e.target.value})} />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={14} /> Hawker
                </label>
                <select required value={dispatchData.hawker_id} onChange={e => handleHawkerChange(parseInt(e.target.value))}>
                  {hawkers.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14} color="var(--accent-color)" /> Route Assignment (Updated Daily)
              </label>
              <input 
                type="text" 
                value={dispatchData.route} 
                onChange={e => setDispatchData({...dispatchData, route: e.target.value})}
                placeholder="e.g. Route 3 - East Zone"
              />
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Tag size={14} /> Filter Category
                </label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Package size={14} /> Product
                </label>
                <select required value={dispatchData.product_id} onChange={e => setDispatchData({...dispatchData, product_id: parseInt(e.target.value)})}>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Quantity Issued</label>
              <input required type="number" min="1" value={dispatchData.dispatched_qty} onChange={e => setDispatchData({...dispatchData, dispatched_qty: parseInt(e.target.value) || 1})} />
            </div>

            {/* Live Slip Preview Summary */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Slip Preview & Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Hawker:</span> <strong>{currentHawker?.name || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Route:</span> <strong>{dispatchData.route || 'Unassigned'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Product:</span> <strong>{currentProduct?.name || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Category:</span> <strong>{currentProduct?.category || 'General'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Unit Price:</span> <strong>₹{unitPrice.toFixed(2)}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Total Value:</span> <strong style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>₹{totalValue.toFixed(2)}</strong></div>
              </div>
            </div>
            
            <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}>
              <Send size={18} /> Issue Stock & Generate WhatsApp Slip
            </button>
          </form>
        </div>

        {/* Today's Issued Slips List */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success-color)" /> Today's Issued Slips
          </h3>

          <div style={{ overflowY: 'auto', maxHeight: '560px', marginTop: '1rem' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>No stock issued today yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map(log => {
                  const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}`, route: log.route };
                  const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0, category: 'General' };
                  const slipUnitPrice = product.selling_price || 0;
                  const slipTotalValue = log.dispatched_qty * slipUnitPrice;
                  const slipRoute = log.route || hawker.route || 'General Route';

                  const slipObj = {
                    logId: log.id,
                    date: log.date,
                    hawkerName: hawker.name,
                    contactInfo: hawker.contact_info,
                    route: slipRoute,
                    category: product.category || 'General',
                    productName: product.name,
                    unitPrice: slipUnitPrice,
                    qty: log.dispatched_qty,
                    totalValue: slipTotalValue
                  };

                  return (
                    <div key={log.id} style={{ 
                      padding: '1rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{hawker.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <MapPin size={12} color="var(--accent-color)" /> {slipRoute}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--info-color)' }}>
                            {log.dispatched_qty} units
                          </span>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                            ₹{slipTotalValue.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Product: <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong> ({product.category || 'General'}) @ ₹{slipUnitPrice.toFixed(2)}/unit
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flex: 1 }}
                          onClick={() => setActiveSlipModal(slipObj)}
                        >
                          <FileText size={14} /> View Slip
                        </button>
                        <a 
                          href={buildWhatsAppShareLink(slipObj)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn" 
                          style={{ 
                            padding: '0.4rem 0.75rem', 
                            fontSize: '0.8rem', 
                            background: '#25D366', 
                            color: '#fff',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flex: 1,
                            justifyContent: 'center'
                          }}
                        >
                          <Share2 size={14} /> Share via WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Issue Slip Modal */}
      {activeSlipModal && (
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
          <div className="card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent-color)', position: 'relative' }}>
            <button 
              onClick={() => setActiveSlipModal(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>MORNING ISSUE SLIP</h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Consignment & Daily Distribution</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Issue Date:</span>
                <strong>{activeSlipModal.date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hawker Name:</span>
                <strong>{activeSlipModal.hawkerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Route Assignment:</span>
                <strong style={{ color: 'var(--accent-color)' }}>{activeSlipModal.route}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Product Category:</span>
                <span>{activeSlipModal.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Product Name:</span>
                <strong>{activeSlipModal.productName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Quantity Issued:</span>
                <strong>{activeSlipModal.qty} units</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unit Price:</span>
                <span>₹{Number(activeSlipModal.unitPrice).toFixed(2)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                borderTop: '1px dashed var(--border-color)', 
                paddingTop: '0.75rem', 
                marginTop: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: 700 
              }}>
                <span>Total Value:</span>
                <span style={{ color: 'var(--success-color)' }}>₹{Number(activeSlipModal.totalValue).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <a 
                href={buildWhatsAppShareLink(activeSlipModal)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn"
                style={{ 
                  flex: 1, 
                  background: '#25D366', 
                  color: '#fff', 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  padding: '0.65rem'
                }}
              >
                <Share2 size={16} /> Share via WhatsApp
              </a>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.print()}
                style={{ padding: '0.65rem' }}
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
