import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { 
  TrendingUp, Users, ArrowDown, BarChart2, MapPin, Target,
  Package, ChevronDown, Eye, Tags, Layers, Banknote, Truck,
  RotateCcw, ShoppingBag, Receipt
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({ 
    todays_sales: 0, 
    profit_today: 0, 
    active_hawkers: 0, 
    products_issued_today: 0,
    average_sales: 0
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [timeFilter, setTimeFilter] = useState('Week');
  
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTxDetails = (type) => {
    switch (type) {
      case 'Distribution':
        return { color: '#2563EB', amountColor: '#183833', icon: <Truck size={14} /> };
      case 'Return':
        return { color: '#8B5CF6', amountColor: '#10B981', icon: <RotateCcw size={14} /> };
      case 'Collection':
        return { color: '#10B981', amountColor: '#10B981', icon: <Banknote size={14} /> };
      case 'Purchase':
        return { color: '#F59E0B', amountColor: '#EF4444', icon: <ShoppingBag size={14} /> };
      case 'Expense':
        return { color: '#EF4444', amountColor: '#EF4444', icon: <Receipt size={14} /> };
      default:
        return { color: '#6B7280', amountColor: '#183833', icon: <Receipt size={14} /> };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const [kpiRes, prodRes, trendRes, lowStockRes, recentTxRes] = await Promise.all([
        api.get('/analytics/dashboard-kpis').catch(() => null),
        api.get(`/analytics/top-products?month=${month}&year=${year}`).catch(() => null),
        api.get('/analytics/sales-trend').catch(() => null),
        api.get('/analytics/low-stock?limit=5').catch(() => null),
        api.get('/analytics/recent-transactions?limit=5').catch(() => null)
      ]);

      if (kpiRes) {
        const activeHawkers = kpiRes.active_hawkers || 0;
        const sales = kpiRes.todays_sales || 0;
        const avgSales = activeHawkers > 0 ? (sales / activeHawkers) : 0;
        setKpis({
          todays_sales: sales,
          profit_today: kpiRes.profit_today || 0,
          active_hawkers: activeHawkers,
          products_issued_today: kpiRes.products_issued_today || 0,
          average_sales: avgSales
        });
      }

      if (prodRes && Array.isArray(prodRes)) {
        setTopProducts(prodRes);
      } else {
        setTopProducts([]);
      }

      if (trendRes && Array.isArray(trendRes) && trendRes.length > 0) {
        setSalesTrend(trendRes);
      } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        setSalesTrend(days.map(d => ({ name: d, sales: 0 })));
      }

      if (lowStockRes && Array.isArray(lowStockRes)) {
        setLowStockItems(lowStockRes);
      } else {
        setLowStockItems([]);
      }

      if (recentTxRes && Array.isArray(recentTxRes)) {
        setRecentTransactions(recentTxRes);
      } else {
        setRecentTransactions([]);
      }

    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. TOP STAT METRIC CARDS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        
        {/* Metric 1: Customers / Active Hawkers */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {kpis.active_hawkers}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.35rem' }}>
              Customers
            </div>
          </div>
          <div className="trend-badge up">
            +12%
          </div>
        </div>

        {/* Metric 2: Orders / Issued Units */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {kpis.products_issued_today}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.35rem' }}>
              Orders
            </div>
          </div>
          <div className="trend-badge down">
            -2.02%
          </div>
        </div>

        {/* Metric 3: Revenue / Today's Sales */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {formatCurrency(kpis.todays_sales)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.35rem' }}>
              Revenue
            </div>
          </div>
          <div className="trend-badge up">
            +13%
          </div>
        </div>

        {/* Metric 4: Average Sales */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {formatCurrency(kpis.average_sales)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.35rem' }}>
              Average Sales
            </div>
          </div>
          <div className="trend-badge up">
            +1.03%
          </div>
        </div>

      </div>

      {/* 2. MAIN MIDDLE SECTION (STATISTICS CHART & TOP SELLING PRODUCTS) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', minHeight: '440px' }}>
        
        {/* Statistics Line Chart Container */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          
          {/* Header & Sub-figures & Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Statistics
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(kpis.todays_sales)}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Sales</div>
                </div>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(250)}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Sales</div>
                </div>
              </div>
            </div>

            {/* Range Toggle Pill Switcher */}
            <div style={{ 
              background: '#1B3834', 
              borderRadius: '9999px', 
              padding: '0.25rem', 
              display: 'flex', 
              gap: '0.25rem' 
            }}>
              {['Week', 'Month', 'Year'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeFilter(tab)}
                  style={{
                    background: timeFilter === tab ? '#2DD4BF' : 'transparent',
                    color: timeFilter === tab ? '#183833' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth Coral Line Chart */}
          <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#D0EAE6" strokeDasharray="0 0" vertical={false} />
                <XAxis dataKey="name" stroke="#61837C" tickLine={false} axisLine={false} style={{ fontSize: '0.75rem', fontWeight: 600 }} />
                <YAxis stroke="#61837C" tickLine={false} axisLine={false} style={{ fontSize: '0.75rem', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D8E8E5', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#183833', fontWeight: 700 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#FF4D4D" 
                  strokeWidth={4.5} 
                  dot={false}
                  activeDot={{ r: 7, fill: '#FF4D4D', stroke: '#FFFFFF', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Top Selling Products List Container */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Top Selling Products
            </div>
            <button className="btn-pill-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
              This Week <ChevronDown size={12} />
            </button>
          </div>

          {/* Table / List Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <div>Product</div>
            <div>Price</div>
            <div>Sold</div>
            <div style={{ textAlign: 'right' }}>View Details</div>
          </div>

          {/* List items matching the reference design */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '330px' }}>
            {topProducts.slice(0, 5).map((p, idx) => (
              <div 
                key={p.id || idx} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', 
                  alignItems: 'center',
                  padding: '0.35rem 0',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E0F2F1', color: '#1B3834', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={14} />
                  </div>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                </div>
                
                <div style={{ color: 'var(--text-secondary)' }}>
                  ₹{p.price || p.base_cost || 15}
                </div>

                <div style={{ color: 'var(--text-secondary)' }}>
                  {p.sold || p.total_sold || 25}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button 
                    className="btn-pill-dark" 
                    onClick={() => navigate('/products')}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.675rem' }}
                  >
                    View Product
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* 3. BOTTOM QUICK FEATURE CARDS ROW (Product, Category, Inventory, Collections) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        
        {/* Widget 1: Product */}
        <div 
          className="card" 
          onClick={() => navigate('/products')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#183833', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tags size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Product
          </div>
        </div>

        {/* Widget 2: Category */}
        <div 
          className="card" 
          onClick={() => navigate('/categories')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#2DD4BF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Category
          </div>
        </div>

        {/* Widget 3: Inventory */}
        <div 
          className="card" 
          onClick={() => navigate('/inventory')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#84CC16', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Inventory
          </div>
        </div>

        {/* Widget 4: Collections */}
        <div 
          className="card" 
          onClick={() => navigate('/collections')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#FF4D4D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Collections
          </div>
        </div>

      </div>

      {/* 4. LOW STOCK ALERTS & RECENT TRANSACTIONS ROW (Placed below quick feature cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {/* Left Card: LOW STOCK ALERTS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Low Stock Alerts
            </div>
            <button 
              onClick={() => navigate('/inventory')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'none' }}>Product</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'none' }}>Current Stock</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'none' }}>Min. Stock</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'none' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No low stock items
                    </td>
                  </tr>
                ) : (
                  lowStockItems.slice(0, 5).map((item, idx) => {
                    const isCritical = item.current_stock <= (item.min_stock / 2);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {item.current_stock}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {item.min_stock}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.3rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isCritical ? '#FFEBEB' : '#FFF7ED',
                            color: isCritical ? '#FF4D4D' : '#F59E0B',
                            display: 'inline-block'
                          }}>
                            {isCritical ? 'Critical' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: RECENT TRANSACTIONS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Recent Transactions
            </div>
            <button 
              onClick={() => navigate('/reports')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'none' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'none' }}>Reference</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'none' }}>Party</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'none' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'none' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No recent transactions
                    </td>
                  </tr>
                ) : (
                  recentTransactions.slice(0, 5).map((tx, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: tx.color,
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {tx.icon}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.85rem', color: '#2563EB' }}>
                        {tx.reference}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {tx.party}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontSize: '0.85rem', color: tx.amountColor || 'var(--text-primary)' }}>
                        {tx.amount}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {tx.time}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
