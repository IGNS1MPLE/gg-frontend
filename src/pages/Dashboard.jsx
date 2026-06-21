import React, { useState, useEffect } from 'react';
import { api } from '../api';
import LeaderboardItem from '../components/LeaderboardItem';
import { Printer } from 'lucide-react';

export default function Dashboard() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [metric, setMetric] = useState('revenue');
  const [limit, setLimit] = useState(10);

  const [topProducts, setTopProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [month, year, metric, limit]);

  const fetchData = async () => {
    try {
      const prodRes = await api.get(`/analytics/top-products?month=${month}&year=${year}&metric=${metric}&limit=${limit}`);
      setTopProducts(prodRes);
      
      const sellRes = await api.get(`/analytics/top-sellers?month=${month}&year=${year}&metric=${metric}&limit=${limit}`);
      setTopSellers(sellRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const maxProductRevenue = Math.max(...topProducts.map(p => p.total_revenue || 0), 1);
  const maxSellerRevenue = Math.max(...topSellers.map(s => s.total_revenue || 0), 1);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Top Performers</h1>
        <button className="btn" onClick={handlePrint}>
          <Printer size={18} /> Print Report
        </button>
      </div>

      <div className="filters-panel">
        <div className="filter-item">
          <label style={{margin:0}}>Month:</label>
          <select value={month} onChange={e => setMonth(e.target.value)}>
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <label style={{margin:0}}>Year:</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{width: '100px'}} />
        </div>
        <div className="filter-item">
          <label style={{margin:0}}>Limit:</label>
          <select value={limit} onChange={e => setLimit(e.target.value)}>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="30">Top 30</option>
          </select>
        </div>
        <div className="filter-item">
          <label style={{margin:0}}>Metric:</label>
          <select value={metric} onChange={e => setMetric(e.target.value)}>
            <option value="revenue">By Revenue</option>
            <option value="profit">By Net Profit</option>
          </select>
        </div>
      </div>

      <div className="leaderboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Top Products</h2>
          <div className="leaderboard-list">
            {topProducts.map((p, index) => (
              <LeaderboardItem 
                key={p.id}
                rank={index + 1}
                name={p.name}
                type="product"
                maxRevenue={metric === 'revenue' ? maxProductRevenue : Math.max(...topProducts.map(x => x.total_net_profit))}
                stats={{
                  gross: p.total_revenue,
                  net: p.total_net_profit,
                  deductions: p.total_deductions
                }}
              />
            ))}
            {topProducts.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No data found for this period.</p>}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Top Sellers</h2>
          <div className="leaderboard-list">
            {topSellers.map((s, index) => (
              <LeaderboardItem 
                key={s.id}
                rank={index + 1}
                name={s.name}
                type="seller"
                maxRevenue={metric === 'revenue' ? maxSellerRevenue : Math.max(...topSellers.map(x => x.total_net_profit))}
                stats={{
                  gross: s.total_revenue,
                  net: s.total_net_profit
                }}
              />
            ))}
            {topSellers.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No data found for this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
