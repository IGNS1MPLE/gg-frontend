import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  TrendingUp, Users, AlertCircle, ShoppingBag, Banknote, Award 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [kpis, setKpis] = useState({ todays_sales: 0, active_hawkers: 0, low_stock_items: 0 });
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
        <h1 className="page-title">Dashboard Overview</h1>
        <div style={{ color: 'var(--text-secondary)' }}>Welcome back, Admin</div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success-color)', borderRadius: '12px' }}>
            <Banknote size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Today's Sales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(kpis.todays_sales)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--info-bg)', color: 'var(--info-color)', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Hawkers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpis.active_hawkers}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger-color)', borderRadius: '12px' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Low Stock Items</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpis.low_stock_items}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Top Product</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              {topProducts.length > 0 ? topProducts[0].name : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Sales Trend Chart */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3>Weekly Sales Trend</h3>
          <div style={{ flex: 1, marginTop: '1rem' }}>
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

        {/* Top 10 Products Pie Chart */}
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3>Top Selling Products</h3>
          <div style={{ flex: 1, marginTop: '1rem' }}>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
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
                No sales data yet to display chart.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Hawker Performance */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Award color="#fbbf24" />
            <h3 style={{ margin: 0 }}>Hawker Performance Ranking</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
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
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', fontWeight: 'bold'
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{hawker.name}</td>
                    <td className="text-success" style={{ fontWeight: 'bold' }}>{formatCurrency(hawker.total_revenue)}</td>
                  </tr>
                ))}
                {topHawkers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No performance data available.</td>
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
