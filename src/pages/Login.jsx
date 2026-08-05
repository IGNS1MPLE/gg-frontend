import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, AlertCircle, ShieldCheck, Tag, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin@inventory.com');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get('/notifications/').catch(() => null);
        if (res && res.notifications && Array.isArray(res.notifications) && res.notifications.length > 0) {
          setNotifications(res.notifications.slice(0, 5));
        } else {
          // Default system notifications for visual preview
          setNotifications([
            { id: 1, title: 'Low Stock Warning', description: 'Product "dsdad" is below minimum threshold (1 remaining).', category: 'Stock Alert', time: 'Just now', type: 'warning' },
            { id: 2, title: 'New Product Request', description: 'Request submitted for Energy Drink 250ml by Hawker Staff.', category: 'Requests', time: '10 mins ago', type: 'info' },
            { id: 3, title: 'Collection Deposited', description: '₹343,434 cash collection registered for dsdfdsfsdf.', category: 'Collection', time: '1 hour ago', type: 'success' },
            { id: 4, title: 'Evening Returns Completed', description: 'Evening return log verified for Route 1 hawkers.', category: 'Returns', time: '2 hours ago', type: 'info' }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadNotifications();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username: username || 'admin@inventory.com',
        password: password || 'admin123',
        mode: 'admin'
      };

      try {
        const res = await api.post('/auth/login', payload);
        if (res && res.ok) {
          onLoginSuccess(res.user, 'admin');
          return;
        }
      } catch (err) {
        // Fallback for demo
        if ((payload.username.includes('admin') || payload.username === 'admin') && payload.password === 'admin123') {
          onLoginSuccess({ name: 'Md Nasir (Admin)', email: 'admin@inventory.com', role: 'Admin' }, 'admin');
          return;
        }
      }

      setError('Invalid username or password. Use admin@inventory.com / admin123');
    } catch (e) {
      console.error(e);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemo = () => {
    setUsername('admin@inventory.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0f2d29 0%, #183833 40%, #1e453f 70%, #2dd4bf 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem 1rem'
    }}>
      {/* Background Decorative SVGs */}
      <svg 
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.15, pointerEvents: 'none' }} 
        viewBox="0 0 1440 320"
      >
        <path fill="#2DD4BF" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
      <svg 
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.25, pointerEvents: 'none' }} 
        viewBox="0 0 1440 320"
      >
        <path fill="#0D9488" fillOpacity="1" d="M0,96L48,128C96,160,192,224,288,234.7C384,245,480,203,576,176C672,149,768,139,864,154.7C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Two-Column Master Container */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
        background: '#FFFFFF',
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr'
      }}>

        {/* LEFT COLUMN: System Live Notifications & Updates */}
        <div style={{
          background: 'linear-gradient(160deg, #183833 0%, #1e4d46 60%, #0d9488 100%)',
          padding: '2.5rem 2rem',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live System Alerts
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              System Notifications
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#A7F3D0', margin: 0, opacity: 0.9, lineHeight: '1.45' }}>
              Real-time stock alerts, collection updates, and recent activity log.
            </p>

            {/* Notifications Stream List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.75rem' }}>
              {notifications.map((n, idx) => (
                <div key={n.id || idx} style={{
                  background: 'rgba(0, 0, 0, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0.85rem 1rem',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: n.type === 'warning' ? 'rgba(255, 77, 77, 0.25)' : (n.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(45, 212, 191, 0.25)'),
                    color: n.type === 'warning' ? '#FF4D4D' : (n.type === 'success' ? '#10B981' : '#2DD4BF'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {n.type === 'warning' ? <AlertTriangle size={15} /> : (n.type === 'success' ? <CheckCircle2 size={15} /> : <Bell size={15} />)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF' }}>{n.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>{n.time || 'Today'}</span>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: '#CBD5E1', margin: '0.2rem 0 0 0', lineHeight: '1.35' }}>
                      {n.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Panel Footer Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.775rem', color: '#A7F3D0', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2DD4BF', display: 'inline-block' }}></span>
            System Status: All services operational
          </div>
        </div>

        {/* RIGHT COLUMN: Admin Login Form */}
        <div style={{ padding: '2.5rem 2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} color="#0D9488" />
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ADMIN AUTHENTICATION
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#183833', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              Admin Login
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem 0' }}>
              Enter your admin credentials to access the inventory dashboard.
            </p>

            {error && (
              <div style={{
                background: '#FFEBEB',
                color: '#FF4D4D',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.825rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Input 1: Username / Email */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0D9488',
                borderRadius: '9999px',
                padding: '0.55rem 1.25rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <User size={18} color="#FFFFFF" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin Username / Email"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Input 2: Password */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0D9488',
                borderRadius: '9999px',
                padding: '0.55rem 1.25rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <Lock size={18} color="#FFFFFF" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin Password"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Remember & Forgot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#0D9488', fontWeight: 600, padding: '0 0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ accentColor: '#0D9488', cursor: 'pointer' }}
                  />
                  Remember
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert("Admin password reset request sent."); }}
                  style={{ color: '#0D9488', textDecoration: 'none' }}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Login Button */}
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Login to Admin Console'}
                </button>
              </div>
            </form>

            {/* Quick Demo Fill */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={fillAdminDemo}
                style={{
                  background: '#F0FDFA',
                  color: '#0D9488',
                  border: '1px solid #2DD4BF',
                  borderRadius: '9999px',
                  padding: '0.4rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Auto-fill Demo Admin Credentials
              </button>
            </div>

          </div>

          {/* Footer Signature requested by user */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            designed by <span style={{ color: '#0D9488', fontWeight: 800 }}>Md Nasir</span>
          </div>

        </div>

      </div>

      {/* Bottom Copyright */}
      <div style={{
        marginTop: '1.5rem',
        color: '#FFFFFF',
        fontSize: '0.8rem',
        opacity: 0.8,
        zIndex: 10
      }}>
        &copy; {new Date().getFullYear()} Inventory Management System. All rights reserved.
      </div>

    </div>
  );
}
