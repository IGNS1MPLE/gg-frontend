import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ClipboardCheck, 
  Package, 
  Tags, 
  Banknote, 
  Receipt, 
  BarChart3, 
  Settings,
  Bell,
  Search,
  LogOut,
  User
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Hawkers from './pages/Hawkers';
import DailyDistribution from './pages/DailyDistribution';
import EveningReturns from './pages/EveningReturns';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Collections from './pages/Collections';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

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

  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-title" style={{lineHeight: '1.2'}}>
            AntiGravity<br/><span style={{fontSize: '0.875rem', fontWeight: 400, color: 'var(--accent-color)'}}>ERP & POS System</span>
          </div>
          
          <nav style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/hawkers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} /> Hawkers
            </NavLink>
            <NavLink to="/distribution" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Truck size={18} /> Daily Distribution
            </NavLink>
            <NavLink to="/returns" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardCheck size={18} /> Returns
            </NavLink>
            <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={18} /> Inventory
            </NavLink>
            <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Tags size={18} /> Products
            </NavLink>
            <NavLink to="/collections" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Banknote size={18} /> Collections
            </NavLink>
            <NavLink to="/expenses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={18} /> Expenses
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} /> Reports
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={18} /> Settings
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>
            &copy; {new Date().getFullYear()} All Rights Reserved<br/>Md Nasir Alam
          </div>
        </aside>
        
        <main className="main-content">
          <div className="topbar">
            <div className="topbar-search">
              <Search size={18} color="var(--text-secondary)"/>
              <input type="text" placeholder="Search anything..." />
            </div>
            <div className="topbar-actions">
              
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center'}}
                >
                  <Bell size={20} />
                  <span style={{position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger-color)', width: '8px', height: '8px', borderRadius: '50%'}}></span>
                </button>
                
                {showNotifications && (
                  <div className="dropdown-menu" style={{ width: '300px' }}>
                    <div className="dropdown-header">
                      Notifications (2)
                    </div>
                    <div className="notification-item">
                      <div className="notification-title">Low Stock Alert</div>
                      <div className="notification-desc">Product 'Mango Juice' is below minimum stock level.</div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-title">Daily Sync</div>
                      <div className="notification-desc">All evening returns processed successfully.</div>
                    </div>
                    <button className="dropdown-item" style={{ justifyContent: 'center', color: 'var(--accent-color)', fontWeight: 600 }}>
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Icon */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowProfile(!showProfile)}
                  style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none'}}
                >
                  NA
                </div>

                {showProfile && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Md Nasir Alam</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>Admin User</span>
                    </div>
                    <button className="dropdown-item">
                      <User size={16} /> My Profile
                    </button>
                    <button className="dropdown-item">
                      <Settings size={16} /> Preferences
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                    <button className="dropdown-item" style={{ color: 'var(--danger-color)' }}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hawkers" element={<Hawkers />} />
              <Route path="/distribution" element={<DailyDistribution />} />
              <Route path="/returns" element={<EveningReturns />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/products" element={<Products />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
