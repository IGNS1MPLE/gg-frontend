import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Send, CheckCircle, FileText, Share2, Printer, MapPin, Tag, Package, 
  Calendar, User, X, ShoppingCart, Plus, Trash2, AlertCircle 
} from 'lucide-react';
import ProductSearchSelect from '../components/ProductSearchSelect';
import SearchableSelect from '../components/SearchableSelect';

export default function DailyDistribution() {
  const [hawkers, setHawkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  
  // Cart state for multi-product dispatch
  const [cart, setCart] = useState([]);

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

  // Add Product to Cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!dispatchData.product_id) {
      alert('Please select a product first');
      return;
    }
    if (!dispatchData.hawker_id) {
      alert('Please select a hawker');
      return;
    }
    const qty = parseInt(dispatchData.dispatched_qty) || 1;
    if (qty <= 0) {
      alert('Quantity must be at least 1');
      return;
    }

    const targetProduct = products.find(p => p.id === parseInt(dispatchData.product_id));
    if (!targetProduct) return;

    // Check stock
    if (targetProduct.current_stock < qty) {
      alert(`Warning: Only ${targetProduct.current_stock} units available in stock for ${targetProduct.name}.`);
    }

    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => item.product_id === targetProduct.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].qty + qty;
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        qty: newQty,
        totalValue: newQty * targetProduct.selling_price
      };
      setCart(updatedCart);
    } else {
      const newItem = {
        cartId: Date.now() + Math.random(),
        product_id: targetProduct.id,
        productName: targetProduct.name,
        category: targetProduct.category || 'General',
        unitPrice: targetProduct.selling_price || 0,
        qty: qty,
        totalValue: qty * (targetProduct.selling_price || 0),
        stock: targetProduct.current_stock
      };
      setCart([...cart, newItem]);
    }

    // Reset qty input
    setDispatchData(prev => ({ ...prev, dispatched_qty: 1 }));
  };

  // Remove item from Cart
  const handleRemoveFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  // Issue All Items in Cart & Generate Combined Slip
  const handleIssueAll = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add products to issue.');
      return;
    }
    if (!dispatchData.hawker_id) {
      alert('Please select a hawker.');
      return;
    }

    try {
      // Dispatch each item in cart
      for (const item of cart) {
        await api.post('/dispatch/', {
          date: dispatchData.date,
          hawker_id: dispatchData.hawker_id,
          route: dispatchData.route,
          product_id: item.product_id,
          dispatched_qty: item.qty
        });
      }

      // Update hawkers local state route if modified
      setHawkers(prev => prev.map(h => h.id === dispatchData.hawker_id ? { ...h, route: dispatchData.route } : h));

      const selectedHawker = hawkers.find(h => h.id === dispatchData.hawker_id) || {};
      
      // Calculate Combined Totals
      const totalProductsCount = cart.length;
      const totalUnitsIssued = cart.reduce((sum, item) => sum + item.qty, 0);
      const grandTotalValue = cart.reduce((sum, item) => sum + item.totalValue, 0);

      // Create Combined Slip Object
      const combinedSlip = {
        isCombined: true,
        date: dispatchData.date,
        hawkerName: selectedHawker.name || 'Hawker',
        contactInfo: selectedHawker.contact_info || '',
        route: dispatchData.route || 'General Route',
        items: [...cart],
        totalProducts: totalProductsCount,
        totalUnits: totalUnitsIssued,
        grandTotalValue: grandTotalValue
      };

      // Show Combined Slip Modal
      setActiveSlipModal(combinedSlip);

      // Clear cart & Refresh data
      setCart([]);
      fetchData();
      alert(`Success! Issued ${totalUnitsIssued} units across ${totalProductsCount} products.`);
    } catch (e) {
      console.error(e);
      alert('Failed to process batch dispatch');
    }
  };

  // Current Hawker & Selected Product details for live form preview
  const currentHawker = hawkers.find(h => h.id === dispatchData.hawker_id);
  const currentProduct = products.find(p => p.id === parseInt(dispatchData.product_id));
  const unitPrice = currentProduct ? currentProduct.selling_price : 0;
  const totalValue = (dispatchData.dispatched_qty || 0) * unitPrice;

  // Cart Calculated Totals
  const cartTotalProducts = cart.length;
  const cartTotalUnits = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartGrandTotal = cart.reduce((sum, i) => sum + i.totalValue, 0);

  // Build WhatsApp Share Link (Handles both Combined Slips and Single Slips)
  const buildWhatsAppShareLink = (slip) => {
    let textMessage = '';

    if (slip.isCombined) {
      const itemsListStr = slip.items.map((item, idx) => 
        `${idx + 1}. *${item.productName}* (${item.qty} units @ ₹${Number(item.unitPrice).toFixed(2)}) = ₹${Number(item.totalValue).toFixed(2)}`
      ).join('\n');

      textMessage = `*DAILY DISTRIBUTION - COMBINED MORNING ISSUE SLIP*
----------------------------------------
📅 *Date:* ${slip.date}
👤 *Hawker:* ${slip.hawkerName}
📍 *Route:* ${slip.route || 'N/A'}
----------------------------------------
📦 *ISSUED PRODUCTS (${slip.totalProducts} Types):*
${itemsListStr}
----------------------------------------
🔢 *Total Units Issued:* ${slip.totalUnits} units
💰 *GRAND TOTAL VALUE:* ₹${Number(slip.grandTotalValue).toFixed(2)}
----------------------------------------
_Issued via Inventory Management System_`;
    } else {
      textMessage = `*DAILY DISTRIBUTION - MORNING ISSUE SLIP*
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
    }

    const encoded = encodeURIComponent(textMessage);
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
            Multi-Item Cart Issue, Combined Morning Slip & WhatsApp Distribution
          </p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Add Product to Cart Form */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} color="var(--accent-color)" /> Add Products to Dispatch Cart
          </h3>

          <form onSubmit={handleAddToCart} className="mt-4">
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
                <SearchableSelect
                  options={hawkers.map(h => ({ value: h.id, label: h.name, sublabel: h.route ? `Route: ${h.route}` : '' }))}
                  value={dispatchData.hawker_id}
                  onChange={(val) => val && handleHawkerChange(parseInt(val))}
                  placeholder="Search or select hawker..."
                  required
                  icon={User}
                />
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

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Package size={14} /> Product (Searchable)
              </label>
              <ProductSearchSelect
                products={products}
                value={dispatchData.product_id}
                onChange={(val) => setDispatchData({...dispatchData, product_id: val ? parseInt(val) : ''})}
                placeholder="Search by product name, category, or code..."
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity Issued</label>
              <input 
                required 
                type="number" 
                min="1" 
                value={dispatchData.dispatched_qty} 
                onChange={e => setDispatchData({...dispatchData, dispatched_qty: parseInt(e.target.value) || 1})} 
              />
            </div>

            {/* Live Item Preview Summary */}
            <div style={{
              background: '#F2F9F8',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Item Preview
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.875rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Hawker:</span> <strong>{currentHawker?.name || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Product:</span> <strong>{currentProduct?.name || '-'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Unit Price:</span> <strong>₹{unitPrice.toFixed(2)}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Item Total:</span> <strong style={{ color: 'var(--accent-color)', fontSize: '0.95rem' }}>₹{totalValue.toFixed(2)}</strong></div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', fontWeight: 700 }}
            >
              <ShoppingCart size={18} /> Add Product to Cart
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Cart & Combined Issue Slip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CART CARD */}
          <div className="card" style={{ border: '2px solid var(--accent-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ShoppingCart size={20} color="var(--accent-color)" /> Issue Cart ({cart.length} Products)
              </h3>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])} 
                  style={{ background: 'none', border: 'none', color: 'var(--coral-red)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {currentHawker && (
              <div style={{ 
                background: 'var(--accent-pill)', 
                color: 'var(--text-primary)', 
                padding: '0.5rem 0.85rem', 
                borderRadius: '8px', 
                fontSize: '0.85rem', 
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Hawker: <strong>{currentHawker.name}</strong></span>
                <span>Route: <strong>{dispatchData.route || 'General'}</strong></span>
              </div>
            )}

            {/* Cart Items List */}
            <div style={{ overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cart.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                  <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600 }}>Your issue cart is empty</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Select products on the left and click "Add Product to Cart".</div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.cartId} style={{
                    padding: '0.75rem 1rem',
                    background: '#F9FCFC',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                        {index + 1}. {item.productName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.qty} units × ₹{item.unitPrice.toFixed(2)}/unit
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-color)' }}>
                          ₹{item.totalValue.toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.cartId)}
                        title="Remove from cart"
                        style={{
                          background: 'rgba(255, 77, 77, 0.1)',
                          border: 'none',
                          color: 'var(--coral-red)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CART GRAND TOTAL & ISSUE ALL BUTTON */}
            {cart.length > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1.5px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Summary ({cartTotalProducts} Products):</div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{cartTotalUnits} Total Units</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Combined Total:</div>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--success-color)' }}>₹{cartGrandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <button 
                  onClick={handleIssueAll} 
                  className="btn btn-success" 
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 800 }}
                >
                  <Send size={18} /> Issue All & Generate Combined Slip
                </button>
              </div>
            )}
          </div>

          {/* TODAY'S ISSUED SLIPS LIST */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="var(--success-color)" /> Today's Issued Slips ({logs.length})
            </h3>

            <div style={{ overflowY: 'auto', maxHeight: '280px', marginTop: '1rem' }}>
              {logs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <div>No stock issued today yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {logs.map(log => {
                    const hawker = hawkers.find(h => h.id === log.hawker_id) || { name: `Hawker #${log.hawker_id}`, route: log.route };
                    const product = products.find(p => p.id === log.product_id) || { name: `Product #${log.product_id}`, selling_price: 0, category: 'General' };
                    const slipUnitPrice = product.selling_price || 0;
                    const slipTotalValue = log.dispatched_qty * slipUnitPrice;
                    const slipRoute = log.route || hawker.route || 'General Route';

                    const slipObj = {
                      isCombined: false,
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
                        padding: '0.75rem 1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{hawker.name}</div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <MapPin size={11} color="var(--accent-color)" /> {slipRoute}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--info-color)' }}>
                              {log.dispatched_qty} units
                            </span>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                              ₹{slipTotalValue.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Product: <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong> @ ₹{slipUnitPrice.toFixed(2)}/unit
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.775rem', flex: 1 }}
                            onClick={() => setActiveSlipModal(slipObj)}
                          >
                            <FileText size={13} /> View Slip
                          </button>
                          <a 
                            href={buildWhatsAppShareLink(slipObj)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn" 
                            style={{ 
                              padding: '0.3rem 0.6rem', 
                              fontSize: '0.775rem', 
                              background: '#25D366', 
                              color: '#fff',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              flex: 1,
                              justifyContent: 'center'
                            }}
                          >
                            <Share2 size={13} /> WhatsApp
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

      </div>

      {/* COMBINED OR SINGLE ISSUE SLIP MODAL */}
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
          <div className="card" style={{ maxWidth: '520px', width: '100%', border: '2px solid var(--accent-color)', position: 'relative' }}>
            <button 
              onClick={() => setActiveSlipModal(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                {activeSlipModal.isCombined ? 'COMBINED MORNING ISSUE SLIP' : 'MORNING ISSUE SLIP'}
              </h2>
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

              {/* Multi-Item Table for Combined Slip */}
              {activeSlipModal.isCombined ? (
                <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Issued Products Itemized List ({activeSlipModal.totalProducts} Products):
                  </div>

                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F2F9F8', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem 0.5rem' }}>Item</th>
                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSlipModal.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.45rem 0.5rem', fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right' }}>₹{Number(item.unitPrice).toFixed(2)}</td>
                          <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>₹{Number(item.totalValue).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    borderTop: '2px solid var(--text-primary)', 
                    paddingTop: '0.75rem', 
                    marginTop: '0.75rem',
                    fontSize: '1.15rem',
                    fontWeight: 800 
                  }}>
                    <span>Grand Total ({activeSlipModal.totalUnits} units):</span>
                    <span style={{ color: 'var(--success-color)' }}>₹{Number(activeSlipModal.grandTotalValue).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                /* Single Item Details */
                <>
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
                    justifyContent: 'space-between', 
                    borderTop: '1px dashed var(--border-color)', 
                    paddingTop: '0.75rem', 
                    marginTop: '0.5rem',
                    fontSize: '1.1rem',
                    fontWeight: 700 
                  }}>
                    <span>Total Value:</span>
                    <span style={{ color: 'var(--success-color)' }}>₹{Number(activeSlipModal.totalValue).toFixed(2)}</span>
                  </div>
                </>
              )}
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
                  padding: '0.65rem',
                  fontWeight: 700
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
