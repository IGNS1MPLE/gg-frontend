import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Truck, ClipboardCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import ActiveDispatches from './pages/ActiveDispatches';
import EveningReturns from './pages/EveningReturns';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-title" style={{lineHeight: '1.2'}}>
            Consignment & Seller<br/><span style={{fontSize: '0.875rem', fontWeight: 400, color: 'var(--accent-color)'}}>Analytics System</span>
          </div>
          
          <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Top Performers
            </NavLink>
            <NavLink to="/dispatches" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Truck size={20} />
              Active Dispatches
            </NavLink>
            <NavLink to="/returns" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardCheck size={20} />
              Evening Returns
            </NavLink>
            <NavLink to="/operations" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              Operations
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>
            &copy; {new Date().getFullYear()} All Rights Reserved<br/>Md Nasir Alam
          </div>
        </aside>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dispatches" element={<ActiveDispatches />} />
            <Route path="/returns" element={<EveningReturns />} />
            <Route path="/operations" element={<Operations />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
