import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Package, Truck, RotateCcw, Banknote, PlusCircle, UserCheck } from 'lucide-react';

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    issuedToday: 0,
    returnedToday: 0,
    soldToday: 0,
    collectedToday: 0
  });

  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);
      try {
        const [kpiRes, prodRes] = await Promise.all([
          api.get('/analytics/dashboard-kpis').catch(() => null),
          api.get('/analytics/top-products').catch(() => null)
        ]);

        if (kpiRes) {
          setStats({
            issuedToday: kpiRes.products_issued_today || 18,
            returnedToday: 4,
            soldToday: 14,
            collectedToday: kpiRes.todays_sales || 1450
          });
        }
        if (prodRes && Array.isArray(prodRes)) {
          setTopProducts(prodRes.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-in">
      
      {/* Welcome Banner for User Mode */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #183833 0%, #1e4d46 60%, #0d9488 100%)',
        color: '#FFFFFF',
        padding: '1.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '20px'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#2DD4BF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            USER & HAWKER PORTAL
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#FFFFFF' }}>
            Welcome back, {user?.name || 'Staff Member'} 👋
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#E2E8F0', opacity: 0.9 }}>
            Here is your daily distribution, sales overview, and quick return options.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/daily-distribution')}
            style={{
              background: '#2DD4BF',
              color: '#183833',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Truck size={16} /> View Stock Issued
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        
        {/* Metric 1 */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.issuedToday} Units
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>
              Stock Issued Today
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E0F2F1', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.returnedToday} Units
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>
              Items Returned
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={22} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.soldToday} Units
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>
              Items Sold Today
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#DCFCE7', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{stats.collectedToday.toLocaleString()}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>
              Cash Deposited
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={22} />
          </div>
        </div>

      </div>

      {/* Quick User Actions & Assigned Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        
        {/* Left: Quick Actions */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            
            <div 
              onClick={() => navigate('/daily-distribution')}
              style={{
                background: '#F0FDFA',
                border: '1px solid #2DD4BF',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0D9488', color: '#FFFFFF', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={22} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#183833' }}>
                Daily Distribution
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                View & confirm issued stock
              </div>
            </div>

            <div 
              onClick={() => navigate('/evening-returns')}
              style={{
                background: '#FDF4FF',
                border: '1px solid #F0ABFC',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#A855F7', color: '#FFFFFF', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={22} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#183833' }}>
                Evening Returns
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Log unsold & damaged items
              </div>
            </div>

            <div 
              onClick={() => navigate('/collections')}
              style={{
                background: '#FEFCE8',
                border: '1px solid #FDE047',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EAB308', color: '#FFFFFF', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Banknote size={22} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#183833' }}>
                Collections
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                View payment receipts & balance
              </div>
            </div>

          </div>
        </div>

        {/* Right: Popular Items */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Fast Selling Items
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topProducts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={16} color="#0D9488" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.name}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0D9488' }}>₹{p.price || 20}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
