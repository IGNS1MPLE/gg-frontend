import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';
import { 
  LayoutDashboard, 
  Users, 
  Tags,
  Layers,
  Package, 
  Truck, 
  ClipboardCheck, 
  Banknote, 
  Receipt, 
  BarChart3, 
  Bell,
  UserCheck,
  Settings,
  Search,
  LogOut,
  User,
  PlusCircle,
  X,
  Home,
  Mail,
  ShieldCheck,
  UserCheck2,
  RefreshCw
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import Hawkers from './pages/Hawkers';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import DailyDistribution from './pages/DailyDistribution';
import EveningReturns from './pages/EveningReturns';
import Collections from './pages/Collections';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import NotificationsPage from './pages/NotificationsPage';
import UsersRoles from './pages/UsersRoles';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('app_role') || 'admin';
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsData, setNotificationsData] = useState({ count: 0, notifications: [] });
  const [activeNotifFilter, setActiveNotifFilter] = useState('ALL');
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const [hawkersList, setHawkersList] = useState([]);
  const [newRequest, setNewRequest] = useState({
    product_name: '',
    category: 'General',
    hawker_id: '',
    notes: ''
  });

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleLoginSuccess = (userObj, role) => {
    const roleNormalized = (role || 'admin').toLowerCase();
    setCurrentUser(userObj);
    setActiveRole(roleNormalized);
    localStorage.setItem('app_user', JSON.stringify(userObj));
    localStorage.setItem('app_role', roleNormalized);
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user');
    localStorage.removeItem('app_role');
  };

  const toggleRoleMode = () => {
    const newRole = activeRole === 'admin' ? 'user' : 'admin';
    setActiveRole(newRole);
    localStorage.setItem('app_role', newRole);
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications/');
      setNotificationsData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHawkers = async () => {
    try {
      const data = await api.get('/hawkers/');
      setHawkersList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchHawkers();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateProductRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRequest,
        hawker_id: newRequest.hawker_id ? parseInt(newRequest.hawker_id) : null
      };
      await api.post('/product-requests/', payload);
      setShowRequestModal(false);
      setNewRequest({ product_name: '', category: 'General', hawker_id: '', notes: '' });
      fetchNotifications();
      alert('New product request submitted successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to submit product request');
    }
  };

  const filteredNotifs = notificationsData.notifications.filter(n => {
    if (activeNotifFilter === 'ALL') return true;
    if (activeNotifFilter === 'STOCK') return n.category.includes('Stock');
    if (activeNotifFilter === 'RETURNS') return n.category.includes('Collection') || n.category.includes('Return');
    if (activeNotifFilter === 'EXPIRY') return n.category.includes('Expiry');
    if (activeNotifFilter === 'ABSENCE') return n.category.includes('Absence');
    if (activeNotifFilter === 'REQUESTS') return n.category.includes('Request');
    return true;
  });

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return activeRole === 'admin' ? 'Admin Dashboard' : 'User Dashboard';
      case '/hawkers': return 'Hawkers';
      case '/products': return 'Products';
      case '/categories': return 'Categories';
      case '/inventory': return 'Inventory';
      case '/distribution': return 'Daily Distribution';
      case '/returns': return 'Evening Returns';
      case '/collections': return 'Collections';
      case '/expenses': return 'Expenses';
      case '/reports': return 'Reports';
      case '/notifications': return 'Notifications';
      case '/users': return 'Users & Roles';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  // If user is not logged in, render the Login screen
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = activeRole === 'admin';

  return (
    <div className="app-container">
      <aside className="sidebar">
        
        {/* Header Badge indicating mode */}
        <div className="sidebar-title" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sidebar-brand-badge">★</span> 
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Inventory Hub</span>
          </div>
          <div style={{
            marginTop: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: isAdmin ? 'rgba(45, 212, 191, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isAdmin ? '#2DD4BF' : '#F59E0B',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            {isAdmin ? <ShieldCheck size={12} /> : <UserCheck2 size={12} />}
            {isAdmin ? 'ADMIN MODE' : 'USER MODE'}
          </div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> {isAdmin ? 'Dashboard' : 'My Dashboard'}
          </NavLink>

          {/* ADMIN ONLY ROUTES */}
          {isAdmin && (
            <>
              <NavLink to="/hawkers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={18} /> Hawkers
              </NavLink>

              <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <Tags size={18} /> Products
              </NavLink>

              <NavLink to="/categories" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <Layers size={18} /> Categories
              </NavLink>

              <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <Package size={18} /> Inventory
              </NavLink>
            </>
          )}

          {/* COMMON & USER ROUTES */}
          <NavLink to="/distribution" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Truck size={18} /> {isAdmin ? 'Daily Distribution' : 'Issued Stock'}
          </NavLink>

          <NavLink to="/returns" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardCheck size={18} /> Returns
          </NavLink>

          <NavLink to="/collections" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Banknote size={18} /> Collections
          </NavLink>

          {/* ADMIN ONLY FINANCIAL & ANALYTICS */}
          {isAdmin && (
            <>
              <NavLink to="/expenses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <Receipt size={18} /> Expenses
              </NavLink>

              <NavLink to="/reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} /> Reports
              </NavLink>
            </>
          )}

          <NavLink to="/notifications" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Bell size={18} /> Notifications
            {notificationsData.count > 0 && (
              <span className="badge danger" style={{ marginLeft: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                {notificationsData.count}
              </span>
            )}
          </NavLink>

          {isAdmin && (
            <NavLink to="/users" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={18} /> Users & Roles
            </NavLink>
          )}

          <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} /> Settings
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.85 }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.2rem' }}>
            designed by Md Nasir
          </div>
          &copy; {new Date().getFullYear()} All Rights Reserved
        </div>
      </aside>
      
      <main className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="topbar-breadcrumb">
              <Home size={15} style={{ marginBottom: '1px' }} /> HOME &gt; <span>{getPageTitle()}</span>
            </div>

            {/* QUICK DUAL MODE TOGGLE BUTTON */}
            <button
              onClick={toggleRoleMode}
              title="Toggle view between Admin Mode and User Mode"
              style={{
                background: isAdmin ? 'linear-gradient(135deg, #183833, #0d9488)' : 'linear-gradient(135deg, #d97706, #f59e0b)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <RefreshCw size={13} />
              Switch to {isAdmin ? 'User View' : 'Admin View'}
            </button>
            
            <div className="topbar-search">
              <Search size={16} color="var(--text-secondary)" />
              <input type="text" placeholder="Search..." />
            </div>
          </div>

          <div className="topbar-actions">
            
            {/* Request Product Button */}
            <button 
              className="btn btn-secondary"
              onClick={() => setShowRequestModal(true)}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={14} color="var(--accent-color)" /> + Request Product
            </button>

            <button 
              className="topbar-icon-btn" 
              title="Product Requests"
              onClick={() => setShowRequestModal(true)}
            >
              <Mail size={18} />
              <span className="topbar-badge">2</span>
            </button>
            
            {/* Notification Center Bell & Dropdown */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className="topbar-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notification Center"
              >
                <Bell size={18} />
                {notificationsData.count > 0 && (
                  <span className="topbar-badge">
                    {notificationsData.count}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="dropdown-menu" style={{ width: '380px' }}>
                  <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bell size={16} color="var(--accent-color)" /> Notifications ({notificationsData.count})
                    </span>
                    <button 
                      onClick={() => navigate('/notifications')} 
                      style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {filteredNotifs.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No new notifications.
                      </div>
                    ) : (
                      filteredNotifs.map(n => (
                        <div 
                          key={n.id}
                          className="notification-item"
                          onClick={() => { setShowNotifications(false); navigate(n.link); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-desc">{n.description}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div 
                className="user-profile-pill"
                onClick={() => setShowProfile(!showProfile)}
              >
                <span className="user-profile-name">{currentUser.name || 'User'}</span>
                <div className="user-avatar-circle">
                  <User size={18} />
                </div>
              </div>

              {showProfile && (
                <div className="dropdown-menu">
                  <div className="dropdown-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{currentUser.name}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                      {isAdmin ? 'Admin Mode' : 'User Mode'}
                    </span>
                  </div>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <Settings size={16} /> Preferences
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.4rem 0' }}></div>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger-color)' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
        
        <div className="page-content">
          <Routes>
            <Route path="/" element={isAdmin ? <Dashboard /> : <UserDashboard user={currentUser} />} />
            <Route path="/hawkers" element={isAdmin ? <Hawkers /> : <UserDashboard user={currentUser} />} />
            <Route path="/products" element={isAdmin ? <Products /> : <UserDashboard user={currentUser} />} />
            <Route path="/categories" element={isAdmin ? <Categories /> : <UserDashboard user={currentUser} />} />
            <Route path="/inventory" element={isAdmin ? <Inventory /> : <UserDashboard user={currentUser} />} />
            <Route path="/distribution" element={<DailyDistribution />} />
            <Route path="/returns" element={<EveningReturns />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/expenses" element={isAdmin ? <Expenses /> : <UserDashboard user={currentUser} />} />
            <Route path="/reports" element={isAdmin ? <Reports /> : <UserDashboard user={currentUser} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/users" element={isAdmin ? <UsersRoles /> : <UserDashboard user={currentUser} />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>

      {/* New Product Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent-color)', position: 'relative' }}>
            <button 
              onClick={() => setShowRequestModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle color="var(--accent-color)" size={20} /> Submit New Product Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Request a new product to be added to the inventory catalog.
            </p>

            <form onSubmit={handleCreateProductRequest}>
              <div className="form-group">
                <label>Requested Product Name *</label>
                <input 
                  required 
                  type="text" 
                  value={newRequest.product_name} 
                  onChange={e => setNewRequest({...newRequest, product_name: e.target.value})} 
                  placeholder="e.g. Energy Drink 250ml" 
                />
              </div>

              <div className="form-group">
                <label>Product Category</label>
                <input 
                  type="text" 
                  value={newRequest.category} 
                  onChange={e => setNewRequest({...newRequest, category: e.target.value})} 
                  placeholder="e.g. Beverages" 
                />
              </div>

              <div className="form-group">
                <label>Requesting Hawker / Staff (Optional)</label>
                <select 
                  value={newRequest.hawker_id} 
                  onChange={e => setNewRequest({...newRequest, hawker_id: e.target.value})}
                >
                  <option value="">-- General Staff Request --</option>
                  {hawkersList.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notes / Reason for Request</label>
                <input 
                  type="text" 
                  value={newRequest.notes} 
                  onChange={e => setNewRequest({...newRequest, notes: e.target.value})} 
                  placeholder="e.g. High demand on Route 2" 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Submit Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
