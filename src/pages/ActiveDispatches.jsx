import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Truck } from 'lucide-react';

export default function ActiveDispatches() {
  const [activeLogs, setActiveLogs] = useState([]);
  const [products, setProducts] = useState({});
  const [sellers, setSellers] = useState({});

  useEffect(() => {
    fetchData();
    // Setting up a basic poll every 10 seconds to keep data fresh since this is a monitoring page
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all required data in parallel
      const [logsData, productsData, sellersData] = await Promise.all([
        api.get('/logs/'),
        api.get('/products/'),
        api.get('/sellers/')
      ]);

      // Create lookup dictionaries for faster rendering
      const productLookup = {};
      productsData.forEach(p => productLookup[p.id] = p.name);
      setProducts(productLookup);

      const sellerLookup = {};
      sellersData.forEach(s => sellerLookup[s.id] = s.name);
      setSellers(sellerLookup);

      // Filter for today's logs that haven't been returned yet (returned_qty === 0)
      const today = new Date().toISOString().split('T')[0];
      const outToday = logsData.filter(log => log.date === today && log.returned_qty === 0);
      
      setActiveLogs(outToday);
    } catch (err) {
      console.error("Error fetching active dispatches:", err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={28} /> Active Dispatches Today
        </h1>
      </div>

      <div className="card">
        {activeLogs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
            No active dispatches right now. Everyone has checked in!
          </p>
        ) : (
          <div className="leaderboard-list">
            {activeLogs.map((log) => (
              <div key={log.id} className="leaderboard-item" style={{ padding: '1.5rem 0' }}>
                <div className="item-header">
                  <div className="item-name" style={{ gap: '1rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem'
                    }}>
                      {(sellers[log.seller_id] || '?').charAt(0)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.125rem' }}>{sellers[log.seller_id] || 'Unknown Seller'}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Log #{log.id}</span>
                    </div>
                  </div>
                  
                  <div className="item-stats" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>{log.dispatched_qty} Units</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent-color)' }}>{products[log.product_id] || 'Unknown Product'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
