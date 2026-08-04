import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  TrendingUp, Users, AlertCircle, ShoppingBag, Banknote, Award, 
  AlertTriangle, Receipt, Wallet, Truck, RotateCcw, PackageCheck, Star
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [kpis, setKpis] = useState({ 
    todays_sales: 0, 
    profit_today: 0, 
    active_hawkers: 0, 
    low_stock_items: 0,
    products_issued_today: 0,
    returns_today: 0,
    pending_collection: 0,
    top_selling_product: 'None'
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [topHawkers, setTopHawkers] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);

  const fetchData = async () => {
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const [kpiRes, prodRes, hawkRes, trendRes] = await Promise.all([
        api.get('/analytics/dashboard-kpis'),
        api.get(`/analytics/top-products?month=${month}&year=${year}`),
        api.get(`/analytics/top-hawkers?month=${month}&year=${year}`),
        api.get('/analytics/sales-trend')
      ]);
      setKpis(kpiRes);
      setTopProducts(prodRes);
      setTopHawkers(hawkRes);
      setSalesTrend(trendRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => `₹${(val || 0).toFixed(2)}`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Real-time operations, daily dispatches, returns, collection status & financial metrics.
          </p>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* SUGGESTED LAYOUT ROW 1: | Today's Sales | Profit | Active Hawkers | Low Stock | */}
      <div className="grid-cols-4" style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* KPI 1: Today's Sales */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid var(--success-color)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.18)', color: 'var(--success-color)', borderRadius: '12px' }}>
            <Banknote size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Today's Sales
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-color)', marginTop: '0.2rem' }}>
              {formatCurrency(kpis.todays_sales)}
            </div>
          </div>
        </div>

        {/* KPI 2: Profit Today */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid #8b5cf6',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(139, 92, 246, 0.18)', color: '#8b5cf6', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Profit Today
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.2rem' }}>
              {formatCurrency(kpis.profit_today)}
            </div>
          </div>
        </div>

        {/* KPI 3: Active Hawkers */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid var(--info-color)',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(59, 130, 246, 0.18)', color: 'var(--info-color)', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Hawkers
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info-color)', marginTop: '0.2rem' }}>
              {kpis.active_hawkers} Working
            </div>
          </div>
        </div>

        {/* KPI 4: Low Stock Items */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid var(--danger-color)',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.18)', color: 'var(--danger-color)', borderRadius: '12px' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Low Stock Items
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-color)', marginTop: '0.2rem' }}>
              {kpis.low_stock_items} Items
            </div>
          </div>
        </div>

      </div>

      {/* SUGGESTED LAYOUT ROW 2: | Distribution Today | Returns | Collection Pending | Top Product | */}
      <div className="grid-cols-4" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* KPI 5: Distribution Today (Products Issued) */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid #06b6d4',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(6, 182, 212, 0.18)', color: '#06b6d4', borderRadius: '12px' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Distribution Today
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4', marginTop: '0.2rem' }}>
              {kpis.products_issued_today} Units
            </div>
          </div>
        </div>

        {/* KPI 6: Returns Today */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid #ec4899',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899', borderRadius: '12px' }}>
            <RotateCcw size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Returns Today
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ec4899', marginTop: '0.2rem' }}>
              {kpis.returns_today} Unsold
            </div>
          </div>
        </div>

        {/* KPI 7: Collection Pending */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid var(--warning-color)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(245, 158, 11, 0.18)', color: 'var(--warning-color)', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Collection Pending
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning-color)', marginTop: '0.2rem' }}>
              {formatCurrency(kpis.pending_collection)}
            </div>
          </div>
        </div>

        {/* KPI 8: Top Selling Product */}
        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderLeft: '4px solid #f59e0b',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}>
          <div style={{ padding: '0.85rem', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderRadius: '12px' }}>
            <Star size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top Product
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
              {kpis.top_selling_product}
            </div>
          </div>
        </div>

      </div>

      {/* SUGGESTED LAYOUT ROW 3: | Sales Trend Chart | Top Products | Hawker Ranking | */}
      <div className="grid-cols-3" style={{ display: 'grid', gap: '1.5rem' }}>
        
        {/* Sales Trend Chart */}
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem' }}>Sales Trend Chart</h3>
          <div style={{ flex: 1, marginTop: '0.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Pie Chart */}
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem' }}>Top Selling Products</h3>
          <div style={{ flex: 1, marginTop: '0.75rem' }}>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="total_revenue"
                    nameKey="name"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No sales data available.
              </div>
            )}
          </div>
        </div>

        {/* Hawker Ranking Leaderboard */}
        <div className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Award color="#fbbf24" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Hawker Ranking</h3>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hawker Name</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topHawkers.map((hawker, idx) => (
                  <tr key={hawker.id}>
                    <td>
                      <span className="rank-badge" style={{ 
                        background: idx === 0 ? '#fbbf24' : (idx === 1 ? '#e5e7eb' : (idx === 2 ? '#d97706' : 'rgba(255,255,255,0.1)')),
                        color: idx === 0 ? '#78350f' : (idx === 1 ? '#374151' : (idx === 2 ? '#fffbeb' : 'var(--text-primary)')),
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.8rem'
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{hawker.name}</td>
                    <td className="text-success" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{formatCurrency(hawker.total_revenue)}</td>
                  </tr>
                ))}
                {topHawkers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No performance data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
