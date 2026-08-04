import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell, ShieldAlert, AlertTriangle, Clock, PlusCircle, CheckCircle, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const [data, setData] = useState({ count: 0, notifications: [] });
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications/');
      setData(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const filteredNotifs = data.notifications.filter(n => {
    const matchesCategory = activeCategory === 'ALL' ||
      (activeCategory === 'STOCK' && n.category.includes('Stock')) ||
      (activeCategory === 'RETURNS' && (n.category.includes('Collection') || n.category.includes('Return'))) ||
      (activeCategory === 'EXPIRY' && n.category.includes('Expiry')) ||
      (activeCategory === 'ABSENCE' && n.category.includes('Absence')) ||
      (activeCategory === 'REQUESTS' && n.category.includes('Request'));

    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            System-wide operational alerts, pending collections, stock alerts, expirations & product requests.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchNotifs()}>
          <Bell size={18} /> Refresh Alerts ({data.count})
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'STOCK', label: '🔔 Low Stock' },
              { id: 'RETURNS', label: '🔔 Pending Collections' },
              { id: 'EXPIRY', label: '🔔 Product Expiry' },
              { id: 'ABSENCE', label: '🔔 Hawker Absence' },
              { id: 'REQUESTS', label: '🔔 Product Requests' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="btn"
                style={{
                  background: activeCategory === cat.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.85rem'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="topbar-search" style={{ margin: 0, width: '260px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifs.map(n => (
            <div
              key={n.id}
              onClick={() => navigate(n.link)}
              style={{
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.border = '1px solid var(--accent-color)'}
              onMouseLeave={(e) => e.currentTarget.style.border = '1px solid var(--border-color)'}
            >
              <div style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: n.type === 'danger' ? 'var(--danger-bg)' : (n.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : (n.type === 'success' ? 'var(--success-bg)' : 'var(--info-bg)')),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {n.type === 'danger' && <ShieldAlert size={24} color="var(--danger-color)" />}
                {n.type === 'warning' && <AlertTriangle size={24} color="var(--warning-color)" />}
                {n.type === 'info' && <Clock size={24} color="var(--info-color)" />}
                {n.type === 'success' && <PlusCircle size={24} color="var(--success-color)" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{n.title}</h4>
                  <span className={`badge ${n.type}`}>{n.category}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {n.description}
                </p>
              </div>
            </div>
          ))}

          {filteredNotifs.length === 0 && (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <div>No notifications found in this view.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
